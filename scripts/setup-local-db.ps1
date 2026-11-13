$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$localPath = Join-Path $projectPath '.local'
$dataPath = Join-Path $localPath 'postgres-data'
$pgBin = 'C:\Program Files\PostgreSQL\17\bin'
New-Item -ItemType Directory -Force -Path $localPath | Out-Null
$ownerSecretPath = Join-Path $localPath 'postgres-owner.xml'
function New-ProjectSecret { $bytes = New-Object byte[] 36; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); return [Convert]::ToBase64String($bytes) }
if (!(Test-Path (Join-Path $dataPath 'PG_VERSION'))) {
  if (Test-Path $dataPath) { throw 'La carpeta de datos ya existe sin PG_VERSION. Revisarla sin borrarla.' }
  $ownerPassword = New-ProjectSecret
  ConvertTo-SecureString $ownerPassword -AsPlainText -Force | Export-Clixml -LiteralPath $ownerSecretPath
  $passwordFile = Join-Path $localPath 'init-password.tmp'
  [IO.File]::WriteAllText($passwordFile, $ownerPassword, [Text.UTF8Encoding]::new($false))
  try {
    & (Join-Path $pgBin 'initdb.exe') -D $dataPath -U tutorias_owner "--pwfile=$passwordFile" --auth=scram-sha-256 --encoding=UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo inicializar PostgreSQL local.' }
  } finally { Remove-Item -LiteralPath $passwordFile -Force }
}
& (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath status | Out-Null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $pgBin 'pg_ctl.exe') -D $dataPath -l (Join-Path $localPath 'postgres.log') -o '-p 5433 -h 127.0.0.1' -w start
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL en 127.0.0.1:5433.' }
}
$envPath = Join-Path $projectPath 'backend\.env'
if (!(Test-Path $envPath)) {
  $secureOwner = Import-Clixml -LiteralPath $ownerSecretPath
  $ownerCredential = [PSCredential]::new('tutorias_owner', $secureOwner)
  $appPassword = New-ProjectSecret
  $sessionSecret = New-ProjectSecret
  $env:PGPASSWORD = $ownerCredential.GetNetworkCredential().Password
  try {
    $sql = "CREATE ROLE tutorias_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$appPassword';`nCREATE DATABASE tutorias_local OWNER tutorias_app;"
    $sql | & (Join-Path $pgBin 'psql.exe') -X -w -h 127.0.0.1 -p 5433 -U tutorias_owner -d postgres -v ON_ERROR_STOP=1 -f -
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear rol/base; se conservaron los datos para inspeccion.' }
    $encodedPassword = [uri]::EscapeDataString($appPassword)
    $content = "NODE_ENV=development`nHOST=127.0.0.1`nPORT=4000`nAPP_ORIGIN=http://127.0.0.1:5173`nDATABASE_URL=postgresql://tutorias_app:${encodedPassword}@127.0.0.1:5433/tutorias_local`nSESSION_SECRET=$sessionSecret`n"
    [IO.File]::WriteAllText($envPath, $content, [Text.UTF8Encoding]::new($false))
  } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
}
& node.exe (Join-Path $projectPath 'backend\scripts\setup-address-key.js')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la clave de direcciones. No borrar ni reemplazar la clave existente.' }
Write-Output 'PostgreSQL del proyecto listo en 127.0.0.1:5433. Servicio global conservado. Credenciales fuera de Git.'
