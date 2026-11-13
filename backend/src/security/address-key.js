import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function powershellOptions(path) {
  // El Node lanzado desde PowerShell 7 puede heredar rutas de módulos incompatibles
  // con Windows PowerShell 5.1. Usar sus módulos propios y no pasar secretos .env.
  const childEnv = {};
  for (const name of [
    'SystemRoot',
    'WINDIR',
    'PATH',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
  ]) {
    if (process.env[name]) childEnv[name] = process.env[name];
  }
  const powershellHome = join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0');
  return {
    executable: join(powershellHome, 'powershell.exe'),
    options: {
      env: {
        ...childEnv,
        PSModulePath: join(powershellHome, 'Modules'),
        TUTORIAS_ADDRESS_KEY_PATH: path,
      },
      encoding: 'utf8',
      windowsHide: true,
      timeout: 10000,
      maxBuffer: 16384,
    },
  };
}

export function decodeAddressKey(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(value.trim()))
    throw new Error('La clave de direcciones debe contener exactamente 32 bytes aleatorios.');
  const key = Buffer.from(value.trim(), 'base64');
  if (key.length !== 32 || key.toString('base64') !== value.trim())
    throw new Error('La clave de direcciones no tiene un formato válido.');
  return key;
}

export function readAddressKeyFile(path) {
  if (process.platform !== 'win32')
    throw new Error('Este almacén local de claves requiere Windows DPAPI.');
  const { executable, options } = powershellOptions(path);
  const result = spawnSync(
    executable,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "$ErrorActionPreference='Stop'; $protectedKey = Import-Clixml -LiteralPath $env:TUTORIAS_ADDRESS_KEY_PATH; $credential = [PSCredential]::new('address', $protectedKey); [Console]::Out.Write($credential.GetNetworkCredential().Password)",
    ],
    options,
  );
  if (result.error || result.status !== 0)
    throw new Error(
      'No se pudo abrir la clave de direcciones. Ejecuta db:setup con el usuario de Windows que creó la clave.',
    );
  return decodeAddressKey(result.stdout);
}

export function writeAddressKeyFile(path, key) {
  if (process.platform !== 'win32')
    throw new Error('Este almacén local de claves requiere Windows DPAPI.');
  const { executable, options } = powershellOptions(path);
  const result = spawnSync(
    executable,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "$ErrorActionPreference='Stop'; $keyValue = [Console]::In.ReadToEnd(); ConvertTo-SecureString $keyValue -AsPlainText -Force | Export-Clixml -LiteralPath $env:TUTORIAS_ADDRESS_KEY_PATH",
    ],
    {
      ...options,
      input: key.toString('base64'),
    },
  );
  if (result.error || result.status !== 0)
    throw new Error('No se pudo proteger la clave de direcciones con Windows DPAPI.');
}
