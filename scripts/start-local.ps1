param([switch]$OpenBrowser)
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectPath
& (Join-Path $PSScriptRoot 'setup-local-db.ps1')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar PostgreSQL.' }
& npm.cmd run db:migrate
if ($LASTEXITCODE -ne 0) { throw 'La migracion no termino correctamente.' }
$nodeCommand = (Get-Command node.exe).Source
$localPath = Join-Path $projectPath '.local'
function Test-ProjectEndpoint([string]$url) {
  try { $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3; return $response.StatusCode -eq 200 } catch { return $false }
}
if (!(Test-ProjectEndpoint 'http://127.0.0.1:4000/api/health')) {
  if (Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue) { throw 'El puerto 4000 esta ocupado por un servicio que no responde como la API. No se detuvo ningun proceso ajeno.' }
  $apiProcess = Start-Process -FilePath $nodeCommand -ArgumentList 'src/server.js' -WorkingDirectory (Join-Path $projectPath 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localPath 'api.out.log') -RedirectStandardError (Join-Path $localPath 'api.err.log') -PassThru
  $apiProcess.Id | Set-Content -LiteralPath (Join-Path $localPath 'api.pid')
}
if (!(Test-ProjectEndpoint 'http://127.0.0.1:5173/')) {
  if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { throw 'El puerto 5173 esta ocupado. No se detuvo ningun proceso ajeno.' }
  $vitePath = Join-Path $projectPath 'node_modules\vite\bin\vite.js'
  $viteArgs = '"' + $vitePath + '" --host 127.0.0.1 --port 5173 --strictPort'
  $webProcess = Start-Process -FilePath $nodeCommand -ArgumentList $viteArgs -WorkingDirectory (Join-Path $projectPath 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localPath 'web.out.log') -RedirectStandardError (Join-Path $localPath 'web.err.log') -PassThru
  $webProcess.Id | Set-Content -LiteralPath (Join-Path $localPath 'web.pid')
}
$ready = $false
for ($attempt=0; $attempt -lt 30; $attempt++) {
  if ((Test-ProjectEndpoint 'http://127.0.0.1:4000/api/health') -and (Test-ProjectEndpoint 'http://127.0.0.1:5173/')) { $ready = $true; break }
  Start-Sleep -Milliseconds 500
}
if (!$ready) { throw 'Los servidores no respondieron. Revisar .local/api.err.log y .local/web.err.log.' }
Write-Output 'Tutorias listo: http://127.0.0.1:5173 | API: http://127.0.0.1:4000/api/health'
if ($OpenBrowser) { Start-Process 'http://127.0.0.1:5173/' }
