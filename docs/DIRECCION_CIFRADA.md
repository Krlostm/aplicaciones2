# Ciudad y dirección privada

Ampliación solicitada el 31 de octubre de 2026: ciudad y dirección separadas, sin campus, y dirección cifrada con AES-256-GCM. No se modifican los requisitos académicos originales ni se declara completada una historia futura.

## Tabla compartida

`user_contact_details` contiene cero o un registro por cuenta. `user_id` es PK y FK a `users.id`, con eliminación en cascada. Ambos paneles reutilizan ese registro; no se duplica en los perfiles académico y de tutor.

| Columna                    | Contenido                                                               |
| -------------------------- | ----------------------------------------------------------------------- |
| `user_id`                  | Cuenta propietaria                                                      |
| `city`                     | Ciudad legible, de 2 a 100 caracteres                                   |
| `address_ciphertext`       | Dirección cifrada como `bytea`; no existe columna con su texto original |
| `address_iv`               | IV aleatorio de 12 bytes por guardado                                   |
| `address_auth_tag`         | Etiqueta GCM de 16 bytes                                                |
| `address_key_id`           | Identificador derivado de la clave, sin incluir la clave                |
| `encryption_version`       | Versión 1 del formato y contexto autenticado                            |
| `created_at`, `updated_at` | Fechas de creación y guardado                                           |

La dirección admite de 5 a 240 caracteres. La API recorta espacios y rechaza longitudes inválidas, caracteres de control, HTML y campos extra. PostgreSQL valida FK, tamaños, versión y unicidad del IV con la misma clave entre filas existentes. Las cuentas existentes empiezan sin datos inventados y el registro inicial no exige estos campos.

## Flujo y acceso

El servicio cifra antes de llamar al repositorio: PostgreSQL recibe únicamente ciudad y componentes cifrados mediante SQL parametrizado. Para consultar, el servicio verifica y descifra antes de responder al propietario. Se usa `node:crypto`, `aes-256-gcm`, clave aleatoria independiente de 32 bytes e IV de 12 bytes. El contexto AAD incluye aplicación, tabla, campo, versión y cuenta, para impedir reutilizar una dirección cifrada como la de otra persona.

La dirección no se entrega hasta que `decipher.final()` verifica la etiqueta. Alterar ciphertext, IV o etiqueta, usar otra clave o una versión desconocida produce error controlado sin texto parcial ni detalles sensibles.

- `GET /api/contact-details`: sesión activa; devuelve `{contact: null}` o `{contact: {city, address, updatedAt}}` a su propietario.
- `PUT /api/contact-details`: sesión, CSRF y origen permitido cuando se envía; acepta únicamente `{city, address}` y devuelve el dato guardado.
- No se aceptan identificadores, permisos ni campus enviados por el cliente, ni existe consulta por identificador ajeno.
- La dirección no aparece en login, `/api/auth/me`, el perfil de tutor, la sesión o localStorage, ni se registra en logs de la aplicación.

El formulario está en «Mi cuenta» y en el panel de tutor, con carga, error, reintento y confirmación. Informa de su carácter privado; los datos no se publican ni se entregan a otros estudiantes.

## Clave y conservación

`db:setup`, utilizado por `Iniciar Tutorias.cmd`, prepara `.local/address-key.xml`. Contiene la clave protegida con Windows DPAPI. La clave no está en PostgreSQL, Git, `.env`, el frontend o la cookie. El proceso auxiliar recibe el secreto por stdin y lo devuelve solo a memoria; no se imprime ni se utiliza como argumento. Usa los módulos propios de Windows PowerShell para evitar incompatibilidades heredadas de PowerShell 7.

La clave se reutiliza y se compara con los identificadores guardados. Si falta y existen direcciones cifradas, o no corresponde a ellas, el preparador falla sin reemplazarla ni cambiar datos. Un bloqueo exclusivo impide dos preparaciones simultáneas. Las pruebas usan claves efímeras y un esquema temporal propio.

Conservar el archivo junto con su entorno Windows: DPAPI lo vincula al usuario y equipo que lo crearon. Un `pg_dump` por sí solo no recupera las direcciones descifradas. No hay procedimiento implementado de exportación portable, rotación o restauración en otro equipo. Estas operaciones requieren migrar la clave de forma controlada, sin regenerarla sobre datos existentes. Sin la clave original ni recuperación de su almacén DPAPI, las direcciones no se pueden descifrar.

## Límites

Se cifra únicamente la dirección almacenada; ciudad, identidad, datos académicos y presentación del tutor conservan su protección previa. La contraseña sigue con Argon2id en `users.password_hash`. El backend autorizado puede descifrar la dirección: no es cifrado de extremo a extremo ni cifrado de disco. HTTP se limita a loopback; no se desplegó HTTPS ni se afirma certificación de seguridad. No se ha medido carga para definir una política operativa de rotación.

Referencias: [Node.js Crypto](https://nodejs.org/docs/latest-v22.x/api/crypto.html), [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [Microsoft Export-Clixml y DPAPI](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/export-clixml?view=powershell-5.1). Resultados ejecutados en `PRUEBAS_REALIZADAS.md`.
