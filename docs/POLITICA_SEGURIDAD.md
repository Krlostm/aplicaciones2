# Política de acceso y validaciones

Decisiones implementadas el 10 de noviembre de 2026 para el piloto local. Los valores son decisiones del proyecto y deben revisarse con evidencia de uso; no son una certificación ni se atribuyen a los requisitos originales como si estos fijaran números concretos.

## Contraseñas

Mínimo solicitado: **8 caracteres**; máximo: **128 puntos de código Unicode**. No se recortan espacios de la contraseña. Se permite pegar desde gestores y usar frases largas, espacios, símbolos y Unicode. No se imponen combinaciones obligatorias de mayúsculas, números y símbolos. La validación autoritativa está en la API y la interfaz aplica el mismo rango; la confirmación se comprueba antes de enviar el registro.

Se rechazan una lista local básica de claves comunes, repeticiones de un mismo carácter y claves hechas solo de espacios. Esa lista no es un catálogo completo de contraseñas filtradas. No se consulta un servicio externo con la contraseña. Las claves existentes no se modifican y el login continúa verificando sus hashes originales.

El mínimo de 8 es una petición del usuario para este proyecto. NIST SP 800-63B-4 exige 15 caracteres cuando la contraseña es el único factor y permite 8 cuando forma parte de MFA. Esta aplicación no tiene MFA: no corresponde afirmar cumplimiento de esa política NIST. El bloqueo y Argon2id reducen riesgos concretos, pero no convierten una clave corta en equivalente a una frase larga.

Se conserva Argon2id con sal aleatoria, memoria 19 MiB, dos iteraciones y paralelismo uno. No se usa AES para guardar contraseñas. El costo actual corresponde a un mínimo recomendado por OWASP; no se ha realizado una medición de capacidad bajo carga que justifique parámetros superiores o una afirmación de desempeño.

## Cinco fallos, ventana de quince minutos y bloqueo de quince minutos

| Parámetro                        | Valor                                              | Razón de la decisión                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Umbral                           | 5 contraseñas incorrectas                          | Deja margen para varios errores de escritura y corta pronto una secuencia automatizada. No permite probar cientos de claves por cuenta antes de actuar.                                 |
| Ventana de observación           | 15 minutos desde el primer fallo                   | Agrupa una secuencia reciente y evita que errores aislados de días diferentes se acumulen indefinidamente.                                                                              |
| Duración del bloqueo             | 15 minutos desde el quinto fallo                   | Introduce una espera significativa para el ataque y permite recuperación automática sin exigir intervención administrativa en el piloto. Es menos disruptiva que un bloqueo permanente. |
| Intentos durante bloqueo         | No extienden el vencimiento                        | Impide al atacante mantener el bloqueo indefinidamente con peticiones continuas durante la espera.                                                                                      |
| Login correcto fuera del bloqueo | Limpia los fallos                                  | El propietario recuperó el acceso; los errores anteriores no deben penalizar su siguiente sesión.                                                                                       |
| Límite adicional por IP          | 100 peticiones fallidas/no exitosas por 15 minutos | Reduce barridos de muchos correos desde un origen y deja más margen que un límite por cuenta en redes universitarias compartidas. Los éxitos no consumen ese límite.                    |

OWASP recomienda definir umbral, ventana y duración y considerar el riesgo de denegación de servicio. **OWASP no prescribe que cinco y quince sean universales.** Aquí se eligen como configuración inicial del piloto. Un atacante que conoce el correo todavía puede provocar un bloqueo temporal; ese riesgo y la fricción deben evaluarse antes de un despliegue público. No se declara medido un valor óptimo.

### Persistencia y concurrencia

`auth_login_attempts` guarda un identificador HMAC-SHA256 del correo normalizado, cantidad de fallos, inicio de ventana, vencimiento y último intento. No guarda la contraseña ni el correo en claro. El HMAC usa el secreto del servidor con contexto específico `login:`; por ello conservar el mismo secreto es necesario para conservar la correlación de los contadores al reiniciar. Rotarlo invalida sesiones y cambia los identificadores de intentos.

Las comprobaciones y cambios del contador están en una transacción y un bloqueo asesor PostgreSQL por identificador. Cinco solicitudes simultáneas no eluden el umbral. La consulta de la cuenta utiliza la misma conexión para no agotar el pool esperando otra conexión mientras se mantiene el bloqueo. Se usa el reloj de PostgreSQL para los tiempos. Los registros de más de 24 horas se depuran en lotes pequeños, saltando filas bloqueadas por otras transacciones.

Un navegador nuevo, otra cookie o IP no elimina el bloqueo por cuenta. Reiniciar la API conserva el estado en PostgreSQL. El límite adicional por IP utiliza memoria y se reinicia con la API; no se presenta como persistente. El bloqueo de login no cierra sesiones previamente autenticadas; su duración y revocación siguen la política de sesiones.

La respuesta de bloqueo es HTTP 429, con mensaje comprensible, `Retry-After` y segundos restantes. El quinto fallo inicia el bloqueo y devuelve 429; los cuatro anteriores devuelven 401. Una contraseña correcta durante el bloqueo también espera al vencimiento. Los correos inexistentes siguen el mismo esquema y los errores de credenciales usan un mensaje genérico.

## Validaciones y privacidad

- Nombres/apellidos: texto recortado de 2 a 80 caracteres, sin controles ni HTML; correo válido, normalizado y único; universidad/carrera 2–120; semestre entero 1–8; consentimiento requerido al registrarse.
- Perfil académico: solo campos permitidos; no permite cambiar correo, contraseña, rol o identificador a través de ese formulario.
- Publicaciones: asignatura existente, título 5–120, descripción 20–2000, modalidad enumerada, identificadores UUID y estado booleano. Campos extra y valores fuera de rango se rechazan. El servidor toma la identidad de la sesión.
- Búsqueda: texto de hasta 100 caracteres, asignatura UUID opcional y página entera de 1 a 10000; 12 resultados por página y SQL parametrizado. El texto de búsqueda se trata como dato, sin comodines SQL aportados por el usuario.
- Sesiones PostgreSQL, regeneración al autenticar, caducidad absoluta de 8 horas, cookie HttpOnly/SameSite y CSRF en mutaciones. Se comprueba el estado actual de la cuenta en cada ruta privada.
- Dirección cifrada con AES-256-GCM y clave DPAPI separada; solo se consulta desde la propia cuenta. Las ofertas no incluyen dirección, correo o claves. El catálogo no afirma verificación institucional ni calificaciones inexistentes.

## Demostración y evidencia

Probar con una cuenta creada expresamente para la demostración: cuatro contraseñas incorrectas producen error de credenciales; la quinta muestra el bloqueo. Reintentar con la clave correcta o recargar mantiene la espera. No usar una cuenta que se necesite inmediatamente después para exponer el sprint. Para demostrar el desbloqueo sin esperar en la suite, los tests alteran exclusivamente los tiempos de su esquema temporal; no existe un endpoint de desbloqueo ni un atajo desde el navegador.

Se verifican concurrencia, nueva cookie, vencimiento, reinicio real de API, acceso por propietario, entrada inválida y cifrado. Las evidencias detalladas están excluidas de Git y las pruebas no registran contraseñas, cookies, claves ni direcciones reales.

Fuentes consultadas: [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html). No se evaluó seguridad del sistema operativo, penetración externa, disponibilidad prolongada, MFA, recuperación de contraseñas, HTTPS desplegado ni carga ISO. La aplicación permanece exclusivamente en loopback.

## Alta de tutor, precios y visitas

El cuestionario es una presentación autodeclarada, no una certificación. La sesión sigue siendo de la misma cuenta de estudiante; `isTutor` se obtiene en el servidor y no equivale a administrador. Se exige completar materias y niveles 1–5 para habilitar nuevas cuentas como tutor. Se mantienen los perfiles ya existentes. Datos académicos/perfil/materias/contacto opcional se actualizan transaccionalmente.

La dirección opcional del registro se cifra con la clave independiente existente antes del INSERT, sin registrarla. El detalle público para estudiantes autenticados muestra presentación, precio y dominio declarado, pero no correo ni dirección. Los contadores de visitas son agregados para el tutor; los identificadores almacenados para deduplicar no se exponen al propietario de la publicación. Las visitas propias se excluyen y las publicaciones pausadas son accesibles solo a su propietario. La aplicación no procesa cobros, reservas ni mensajes.
