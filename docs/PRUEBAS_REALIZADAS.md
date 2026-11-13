# Pruebas y evidencia del incremento

La verificación vigente es la del sprint 3, del 10 de noviembre de 2026, al final de este documento. Las secciones anteriores conservan el historial de entregas y sus políticas de contraseña anteriores.

Fecha: 28 de octubre de 2026. Entorno: Windows 11 Home, Node 22.16.0 y PostgreSQL 17.6, sin despliegue público. Las pruebas usan el servidor real y PostgreSQL, sin simular autenticación.

## Resultado funcional

La tabla siguiente conserva los resultados de la entrega original. Las ampliaciones verificadas el 31 de octubre de 2026 figuran al final: perfil de tutor, 67 casos; y ciudad/dirección cifrada, 86 casos aprobados.

| Grupo                                                       | Cantidad | Resultado                                   |
| ----------------------------------------------------------- | -------- | ------------------------------------------- |
| Backend Node test/Supertest con PostgreSQL real             | 31       | 31 aprobadas                                |
| Navegador Chromium de escritorio con Chrome instalado       | 8        | 8 aprobadas                                 |
| Navegador Chromium móvil, viewport Pixel 7                  | 8        | 8 aprobadas                                 |
| Firefox instalado 155.0.1 mediante Puppeteer/WebDriver BiDi | 8        | 8 aprobadas                                 |
| Total de casos automáticos                                  | 55       | 55 aprobadas en las ejecuciones verificadas |

Además: compilación de producción Vite correcta; instalación npm ci en directorio nuevo con el lockfile final correcta; segunda ejecución de migraciones sin cambios correcta; arranque mediante el lanzador Windows correcto; HTTP de frontend y API con respuesta 200; npm audit de todas las dependencias sin vulnerabilidades reportadas en la fecha de ejecución. Estos son controles adicionales, no se suman artificialmente a los 55 casos.

## Los trece criterios solicitados

| Criterio                     | Evidencia ejecutada                                                    | Resultado |
| ---------------------------- | ---------------------------------------------------------------------- | --------- |
| 1 Compilación frontend       | npm run build, dist generado                                           | Aprobado  |
| 2 Inicio backend             | src/server.js, mensaje de conexión, servidor local persistente         | Aprobado  |
| 3 Petición HTTP API          | GET /api/health y suite API                                            | 200       |
| 4 Conexión PostgreSQL        | SELECT 1, metadatos del servidor y base real                           | Aprobado  |
| 5 Creación de usuario        | POST /auth/register desde API y tres perfiles de navegador             | 201       |
| 6 Verificación SQL           | SELECT en users y student_profiles; hash Argon2id verificable          | Aprobado  |
| 7 Correo duplicado           | Mismo correo, mayúsculas y espacios; validación de interfaz            | 409       |
| 8 Login correcto             | Sesión persistida, cookie y nombre real del estudiante                 | 200       |
| 9 Contraseña incorrecta      | Mensaje genérico, sin acceso privado                                   | 401       |
| 10 Ruta protegida autorizada | GET /auth/me y dashboard                                               | 200       |
| 11 Ruta sin sesión           | GET /auth/me 401 y redirección visual al login                         | Aprobado  |
| 12 Logout efectivo           | DELETE de sesión por almacén; reutilización de cookie antigua denegada | Aprobado  |
| 13 Recarga del panel         | Recarga real en Chromium, móvil y Firefox mantiene nombre y acceso     | Aprobado  |

Las pruebas de registro verifican el contenido en PostgreSQL, no solo un aviso visual. Las pruebas de logout comprueban en la API tanto la eliminación persistente como la invalidez de la cookie anterior.

## Cobertura adicional

Los 31 casos API comprueban migración idempotente, usuario/perfil, Argon2id, correo duplicado normalizado, entradas inválidas, contraseña mínima, consentimiento, rechazo de escalamiento de rol en registro, CSRF ausente/incorrecto, origen externo, regeneración de sesión y token, cookie HttpOnly/SameSite, sesión PostgreSQL sin contraseña, error uniforme de credenciales, permisos de estudiante y administrador, cuenta inactiva, expiración absoluta, integridad referencial, semestre, SQL parametrizado, JSON inválido y rutas inexistentes.

Cada grupo de navegador comprueba portada/imagen/filtro visual, protección de ruta, aviso de privacidad, confirmación de contraseña, error de login, recorrido completo con duplicado/SQL/recarga/cuenta/logout, ausencia de desbordamiento y página 404. En Firefox se comprobaron anchos de escritorio y móvil. No se afirma que exista búsqueda funcional de tutores: el filtro de áreas de la portada es una interacción visual del catálogo de referencia.

## Incidencias encontradas y corregidas

1. La primera compilación detectó una etiqueta option incompleta. Se corrigió y la compilación posterior pasó.
2. Una expectativa del test de SQL esperaba 401; el validador rechazaba antes el correo malformado con 422. Se corrigió el test y además se llamó al repositorio con la cadena para verificar que se trata como dato y no altera tablas.
3. La primera prueba visual del flujo descubrió una carrera entre la redirección privada y el aviso de logout. La sesión ya se invalidaba, pero el mensaje no persistía. La salida ahora reinicia el documento después de que el servidor destruye la sesión, elimina el estado privado en memoria y muestra el aviso. La regresión pasó.
4. El Firefox descargado por Playwright no arrancó en Windows: el registro SideBySide informó que no encontraba el ensamblado mozglue. No se alteraron protecciones ni archivos del navegador. Se utilizó el Firefox oficial ya instalado y WebDriver BiDi mediante Puppeteer, con ocho casos equivalentes aprobados. El script final automatiza esa alternativa. La compatibilidad del paquete de Firefox de Playwright sigue siendo una limitación de herramienta, no una prueba exitosa atribuida a él.

## Archivos de evidencia

- `docs/evidencias/backend.tap`: salida de los 31 casos API.
- `docs/evidencias/navegador.json`: resultado estructurado de 16 casos Chromium desktop/móvil.
- `docs/evidencias/e2e.txt`: ejecución combinada de Playwright y la suite Firefox.
- `docs/evidencias/dependencias.txt`: versiones npm exactas observadas.
- `docs/evidencias/postgresql.txt`: nombre de base, puerto, rol y estado de cuentas, sin credenciales.
- `docs/evidencias/portada-*.png`, `registro-*.png`, `login-*.png`, `panel-*.png`: capturas de los motores comprobados. El nombre Lucía corresponde a una cuenta de prueba creada y eliminada durante la suite, no a una cuenta precargada de demostración.
- `docs/evidencias/inicio-sesion.png`: revisión visual final en el navegador de la aplicación.

Las suites de API crean un esquema único temporal y solo eliminan ese esquema al finalizar. Las suites E2E crean correos aleatorios `example.test` y eliminan únicamente esos usuarios y sus sesiones. Los informes detallados se excluyen de Git por contener identificadores de ejecución. Las capturas no incluyen contraseñas.

## Límites de la verificación

Ajuste posterior solicitado el 28 de octubre de 2026: semestres del 1 al 8. Se aplicó la migración `002_semester_limit.sql`, se compiló el frontend y se repitieron los 31 casos API con éxito. Las pruebas existentes verifican que el semestre 8 se registra y que el 9 es rechazado tanto por la API como por la restricción PostgreSQL. Los resultados de navegador anteriores se conservan; no fue necesario repetir toda la suite para cambiar las opciones del selector.

No se ejecutaron carga estadística, disponibilidad prolongada, respaldo/restauración, HTTPS desplegado, geolocalización, extracción PDF, publicaciones, mensajería ni pagos sandbox/reales. No corresponde inferir cumplimiento de RNF-01 o RNF-04 ni certificación ISO/IEC 25010:2023 de estas pruebas funcionales. Las historias futuras permanecen fuera del alcance.

## Ampliación: perfil de tutor y dos paneles, 31 de octubre de 2026

| Grupo repetido con el cambio              | Cantidad | Resultado                                                 |
| ----------------------------------------- | -------- | --------------------------------------------------------- |
| Backend/API con PostgreSQL real           | 41       | 41 aprobadas                                              |
| Chrome de escritorio                      | 9        | 9 aprobadas                                               |
| Chrome móvil, viewport Pixel 7            | 9        | 9 aprobadas                                               |
| Firefox instalado mediante WebDriver BiDi | 8        | 8 aprobadas; recorrido de perfil añadido al caso completo |
| Total                                     | 67       | 67 aprobadas                                              |

Compilación Vite aprobada. Migración `003_tutor_profiles.sql` aplicada a `tutorias_local` y segunda ejecución idempotente aprobada. Se reinició únicamente la API del proyecto para cargar el módulo, conservando PostgreSQL global y los datos existentes. Las pruebas API usan su propio esquema temporal; las de navegador limpian sus cuentas aleatorias y sus perfiles se eliminan por FK en cascada.

Los diez casos API añadidos verifican: sesión obligatoria; perfil opcional inicialmente ausente; errores por campo sin inserciones; creación sin alterar identidad, contraseña ni permisos; guardados concurrentes sin duplicados; rechazo de CSRF ausente y origen externo sin modificar datos; rechazo de `userId` y `role` enviados por el cliente; aislamiento entre dos cuentas; FK, PK y longitud de presentación en PostgreSQL; y rechazo de una cuenta desactivada. La eliminación en cascada también se comprueba al retirar la segunda cuenta de prueba.

Los navegadores comprueban crear y editar el perfil desde la interfaz, persistencia tras recarga, alternancia entre paneles sin otra sesión, conservación del permiso de estudiante, ausencia de identidad en localStorage y ausencia de desbordamiento horizontal. Se revisaron visualmente capturas de escritorio y móvil. Se repitió únicamente el recorrido de tutor para ajustar las capturas de cabeceras fijas a la parte superior de la página; esas repeticiones no se suman al total.

Evidencia de navegador: `docs/evidencias/e2e-tutores.txt`, `navegador.json`, `tutor-capturas.txt` y `tutor-*.png`. La cuenta Lucía de las capturas pertenece a las pruebas y fue eliminada al finalizar. La salida de 41 casos API quedó registrada en la ejecución de `npm test` de esta sesión; `backend.tap` conserva la evidencia de 31 casos de la entrega original.

La ampliación no incluye un catálogo público, publicación de ofertas, disponibilidad, reservas, mensajes ni pagos. El perfil de tutor no se declara como cumplimiento completo de HU-03 ni de otra historia futura. Los campos de presentación no tienen cifrado AES; la protección de contraseñas continúa con Argon2id.

## Ampliación: ciudad separada y dirección AES-256-GCM

Verificación del 31 de octubre de 2026:

| Grupo                                      | Cantidad | Resultado                                               |
| ------------------------------------------ | -------- | ------------------------------------------------------- |
| API/Supertest y PostgreSQL real            | 51       | 51 aprobadas                                            |
| Cifrado y conservación de claves con DPAPI | 7        | 7 aprobadas                                             |
| Chrome de escritorio                       | 10       | 10 aprobadas                                            |
| Chrome móvil, viewport Pixel 7             | 10       | 10 aprobadas                                            |
| Firefox instalado mediante WebDriver BiDi  | 8        | 8 aprobadas; recorrido privado añadido al caso completo |
| Total                                      | 86       | 86 aprobadas                                            |

Build Vite aprobado; migración `004_contact_details.sql` aplicada al proyecto y segunda ejecución idempotente aprobada. La preparación de la clave DPAPI se ejecutó dos veces, conservando el mismo archivo. La API se reinició y arrancó con la clave protegida real, usada por las pruebas de navegador. Se conservaron la base y cuentas existentes y el servicio global del puerto 5432.

Los siete casos criptográficos comprueban Unicode, ausencia de texto original en el ciphertext, IV distinto por guardado, rechazo de alteraciones en ciphertext/IV/tag, AAD ligado a la cuenta, clave equivocada, versiones o etiquetas inválidas, formato de clave y conservación DPAPI. Se verifica que una clave ausente con datos existentes no se regenera y que una clave distinta no reemplaza la original.

Los diez casos API añadidos comprueban sesión obligatoria y datos inicialmente ausentes; validación separada y rechazo de campus/identificadores/permisos; persistencia cifrada con respuesta privada al propietario; edición sin duplicados y con IV renovado; CSRF/origen; ausencia de dirección en identidad y perfil de tutor; fallo controlado al alterar ciphertext sin afectar el login; aislamiento de dos cuentas y rechazo de copia entre identidades; FK/tamaños y eliminación en cascada; y denegación a una cuenta desactivada.

Los navegadores comprueban guardar y editar, recargar, reutilizar los datos entre «Mi cuenta» y panel de tutor, verificar bytes cifrados directamente en PostgreSQL, mantener vacío localStorage y no desbordar horizontalmente. Las capturas de escritorio y móvil se inspeccionaron visualmente. Sus direcciones son textos ficticios de pruebas, no domicilios reales; las cuentas se eliminaron al terminar.

La primera ejecución detectó un conflicto entre las rutas de módulos heredadas de PowerShell 7 y Windows PowerShell 5.1 al proteger la clave. Se corrigió el entorno del proceso auxiliar, sin cambiar la configuración global de PowerShell, y los 58 casos de backend/cifrado pasaron en la segunda ejecución. El error 503 del caso de manipulación es deliberado y la aplicación registra solo código genérico, sin dirección o clave.

Evidencias: `docs/evidencias/aes-backend.tap`, `aes-navegadores.txt`, `navegador.json` y `contact-*.png`. No se probaron exportación portable de claves, rotación o restauración en otro equipo. Los límites de cifrado y conservación se explican en `DIRECCION_CIFRADA.md`.

## Sprint 3 y seguridad, 10 de noviembre de 2026

| Grupo                                     | Casos | Resultado                                                 |
| ----------------------------------------- | ----- | --------------------------------------------------------- |
| API/Supertest con PostgreSQL real         | 65    | Aprobados                                                 |
| Cifrado AES y conservación DPAPI          | 7     | Aprobados                                                 |
| Chrome de escritorio                      | 12    | Aprobados                                                 |
| Chrome móvil, viewport Pixel 7            | 12    | Aprobados                                                 |
| Firefox instalado mediante WebDriver BiDi | 8     | Aprobados; recorrido extendido con perfil y publicaciones |
| Total                                     | 104   | Aprobados                                                 |

Build Vite correcto. `npm audit` reportó cero vulnerabilidades en las dependencias en la ejecución de esta fecha; no equivale a una auditoría de penetración del código o sistema operativo. Entorno observado: Node 22.16.0, npm 11.21.1, PostgreSQL 17.6 y Firefox 155.0.1. La migración `005_sprint_three.sql` se aplicó al proyecto y se repitió sin duplicaciones, sin alterar migraciones anteriores ni el PostgreSQL global.

Los 14 casos nuevos cubren contraseña de ocho caracteres (siete, comunes y más de 128 rechazadas), edición de perfil propio y campos de privilegio rechazados, límites Unicode que no eluden mínimos, publicación con perfil de tutor y asignatura válida, campos obligatorios, CSRF, búsqueda sin tildes/mayúsculas, resultado vacío, privacidad del DTO, edición ajena denegada, desactivación/reactivación, cuentas inactivas, FK y restricciones. También comprueban cinco fallos simultáneos, nueva cookie y contraseña correcta durante el bloqueo, vencimiento automático, limpieza tras éxito, reinicio de ventana y comportamiento equivalente para correos inexistentes.

Chrome de escritorio y móvil comprueban rechazo de siete caracteres en la interfaz, registro con ocho, edición de perfil y persistencia, creación/edición/consulta de publicación, búsqueda y estados, además de cinco fallos y bloqueo tras recargar. Firefox extiende el recorrido completo con perfil, publicación, búsqueda y desactivación. Se inspeccionaron las capturas de escritorio y móvil. El vencimiento de quince minutos se prueba alterando exclusivamente fechas del esquema temporal, sin esperar en tiempo real ni agregar un endpoint de desbloqueo.

Control operativo adicional: se generó un bloqueo ficticio, se reinició solo la API del proyecto y una sesión nueva siguió obteniendo 429 con el tiempo restante (811 segundos), sin reiniciar los quince minutos. Se comprobó contador cinco en PostgreSQL y se retiró ese registro. Este control no se suma artificialmente a los 104 casos. Las cuatro consultas de `CONSULTAS_SPRINT_3.sql` también se ejecutaron correctamente sobre `tutorias_local` en 5433.

Incidencias corregidas: la primera ejecución encontró PostgreSQL local detenido y se inició el clúster propio; se ajustaron mínimos Unicode para evitar diferencias con la longitud PostgreSQL; se corrigió un selector compartido que desbordaba la portada en Firefox móvil. Las repeticiones activaron el límite real de registros por IP, por lo que la ejecución final se hizo tras reiniciar la API, conservando los bloqueos por cuenta en PostgreSQL. No se debilitaron los límites para obtener resultados exitosos.

Las pruebas crean esquemas aislados o cuentas aleatorias y eliminan únicamente sus datos. Las de navegador limpian también los contadores de sus correos ficticios. No se generan ofertas persistentes presentadas como reales. Las trazas de red Playwright quedan desactivadas para que futuros informes no conserven cuerpos de autenticación o cookies; se mantienen resultados y capturas. Para repetir la suite completa inmediatamente, iniciar una instancia propia de API fresca evita acumular el cupo de registros del piloto entre ejecuciones; los bloqueos por cuenta siguen persistiendo.

Evidencias en `docs/evidencias`: `sprint3-backend.tap`, `sprint3-browser.txt`, `sprint3-audit.json`, `sprint3-restart.txt`, `sprint3-visual.txt`, `navegador.json` y `sprint3-*.png`. Informes excluidos del versionado. La política y sus razones están en `POLITICA_SEGURIDAD.md`, y el alcance en `SPRINT_3.md`.

No se afirma que ocho caracteres sin MFA cumpla el mínimo NIST para contraseña como único factor, ni certificación ISO, evaluación de carga, HTTPS público, recuperación de contraseña o MFA. Los sprints posteriores permanecen fuera de este incremento.

## Ejemplos locales para demostración, 11 de noviembre de 2026

Por solicitud del usuario se agregaron tres asignaturas de referencia al catálogo local (doce en total), una cuenta explícitamente ficticia y cinco publicaciones DEMO, cuatro activas y una desactivada. Los datos, identificadores, credencial protegida con DPAPI, preparador idempotente, guía y consultas quedan únicamente en `.local/pruebas-sprint3/`, fuera del versionado. No se modificaron cuentas reales ni se crearon tablas nuevas.

Verificación: preparación repetida sin duplicar ejemplos; edición y restauración del perfil; edición y restauración de una publicación; activación/desactivación y visibilidad en búsqueda; búsqueda sin tildes y vacía; cinco consultas PostgreSQL correctas. Build aprobado y 32 casos de navegador aprobados (24 Chrome escritorio/móvil y 8 Firefox). Las pruebas se ajustaron para seleccionar sus propias ofertas y no presuponer un catálogo vacío, manteniendo intactos los ejemplos solicitados. Evidencia de navegador: `docs/evidencias/datos-sprint3-navegador.txt`; verificación específica de los ejemplos: `.local/pruebas-sprint3/verificacion.json`.

## Rediseño de la landing, 11 de noviembre de 2026

Se sustituyó únicamente la portada por una composición inspirada en la jerarquía de la página indicada por el usuario (Duolingo): mascota, mensaje principal y dos acciones iniciales. Se conservaron Epilogue/Geist y la identidad azul/naranja. Los estilos nuevos se limitan a clases `landing-*`; las pantallas de acceso y los paneles conservan su diseño. Se reemplazaron los textos antiguos de publicaciones futuras por las funciones actualmente disponibles y se conectaron las materias al parámetro real `q` del buscador.

La llama del usuario se utiliza sin modificar el PNG original; ambos originales se conservaron en `referencias/mascota/`. La portada no descarga el GIF de 20 MB. No se añadieron estadísticas, testimonios ni ofertas ficticias a la landing.

Validación final:

- Build Vite aprobado.
- 72 pruebas de backend, cifrado, API e integridad con PostgreSQL real aprobadas (`evidencias/landing-backend.tap`).
- Ocho casos generales de Chrome, repartidos entre escritorio y móvil: imagen cargada, registro, login, enlaces de materias/tutor, privacidad, redirección privada, página desconocida y ausencia de desbordamiento. Dos casos adicionales de sesión real en escritorio y móvil verifican los botones de la landing autenticada y el acceso al panel de tutor; ambos aprobados (`evidencias/landing-sesion.txt`).
- Dos casos Firefox aprobados: portada/enlaces y geometría de las páginas públicas en escritorio y móvil (`evidencias/landing-firefox.txt`).
- Comprobación adicional de la landing a 320, 360, 393, 768, 820, 1024, 1280 y 1536 px: sin desbordamiento ni imágenes rotas, sin errores JavaScript; transiciones desactivadas al preferir movimiento reducido. Se aumentó el contraste de los textos secundarios.
- Inspección visual de escritorio, móvil y tableta. Capturas: `evidencias/landing-escritorio.png`, `landing-movil.png`, `landing-tablet.png` y `portada-*.png`.

La primera ejecución de los casos con base de datos falló porque la instancia local del proyecto estaba detenida. Se inició mediante el lanzador existente en 127.0.0.1:5433, se comprobaron las migraciones y se repitieron los casos afectados con resultado satisfactorio. No fue necesario modificar el backend, las tablas, las credenciales ni el servicio PostgreSQL global. La revisión de navegador se limita a los casos indicados; no se repitió el conjunto completo de 32 casos en este cambio de presentación.

## Ajuste de la landing según la captura completa de referencia, 11 de noviembre de 2026

Se reemplazaron las tarjetas inferiores por tres bloques amplios, apilados y alternados: crear la cuenta, explorar materias y ofrecer tutorías. Cada bloque utiliza una ilustración de la mascota y un acento tomado de su paleta (naranja, rojo del pañuelo y morado de la mochila). Se añadió un cierre de página en morado. Se mantuvieron las rutas y el alcance exclusivos de la landing.

Se incorporaron dos nuevas poses de la llama mediante el generador integrado `imagegen`, editando el PNG del usuario para preservar su identidad. Archivos y prompts completos: `referencias/mascota/variaciones.md`. Los originales y la captura de referencia permanecen en `referencias/mascota/`.

La animación original se codificó como MP4 sin cambiar su contenido: 179 fotogramas, 960 × 540 px, unos 208 KB frente a los 20.4 MB del GIF original. La animación se reproduce silenciada en bucle y tiene control de pausa/reproducción. Con preferencia de movimiento reducido se muestra la imagen estática; se verificó también una carga nueva sin solicitar el MP4.

Verificación: build aprobado; 72 casos backend/API/cifrado/integridad PostgreSQL aprobados; 12 casos Chrome entre escritorio y móvil y dos casos Firefox aprobados. Los casos de recursos se repitieron tras añadir la comprobación y decodificación de las tres ilustraciones antes de capturar la página completa. La captura inicial no había esperado las imágenes cargadas bajo demanda; se corrigió la preparación de la evidencia, sin cambiar esa carga diferida en el producto. No se repitió toda la batería de navegador ajena a este cambio.

Además se comprobó la geometría de la landing a 320, 360, 393, 768, 820, 1024, 1280 y 1536 px: ningún desbordamiento, imagen rota o error de JavaScript. Se inspeccionaron visualmente las tres ilustraciones en escritorio y móvil. Evidencias: `landing-v2-backend.tap`, `landing-v2-chrome.txt`, `landing-v2-recursos.txt`, `landing-v2-firefox.txt`, `landing-v2-firefox-recursos.txt`, `landing-v2-geometria.txt` y capturas `landing-v2-*.png` dentro de `docs/evidencias/`.

## Extensión del diseño a la aplicación completa, 11 de noviembre de 2026

Por indicación explícita del usuario se extendió la nueva identidad a acceso, registro, navegación pública y privada, perfiles, contacto, paneles de estudiante/tutor, formularios, publicaciones, avisos y modales. La paleta compartida utiliza naranja, crema, rojo y morado de la mascota; se conserva Epilogue/Geist. La navegación y franja de materias son naranjas, los botones principales tienen texto blanco y las materias cambian a fondo blanco al pasar el mouse. Se retiraron flechas decorativas de navegación y numeración de las secciones. El autor del pie es `@Carlos Toa`.

Se añadieron un fondo decorativo con formas y puntos en la portada, transiciones suaves, las poses de la mascota al acceder y en los paneles, y un cuarto bloque sobre la oportunidad de obtener ingresos al ofrecer tutorías. Este bloque aclara que los acuerdos y pagos se realizan fuera de la plataforma. No se implementaron pagos ni se prometen resultados económicos. La nueva pose, su archivo final y el prompt de imagegen están documentados en `referencias/mascota/emprendiendo.md`.

Se eliminó el botón visible de pausa por solicitud del usuario; la animación continúa silenciada y en bucle. Se conservan la imagen estática al preferir movimiento reducido y el respaldo estático si la reproducción falla. También se desactivan las transiciones al preferir movimiento reducido.

Verificación final:

- Build Vite aprobado (`docs/evidencias/tema-build.txt`).
- 72 pruebas de backend, API, cifrado e integridad con PostgreSQL real aprobadas (`tema-backend.tap`).
- Batería completa de 34 casos de navegador aprobada: 26 Chrome escritorio/móvil y 8 Firefox (`tema-navegadores.txt`). Incluye registro, duplicados, login/logout, bloqueo, privacidad, perfiles, dirección cifrada, creación/edición/activación de publicaciones, búsqueda y animación sin controles visibles.
- Portada, login y registro comprobados a 320, 393, 768, 1024, 1280 y 1536 px: sin desbordamientos, imágenes rotas, flechas decorativas ni errores JavaScript. Texto blanco en botón principal y fondo blanco de hover en materia comprobados sobre los estilos renderizados (`tema-geometria.txt`).
- Inspección visual de portada, acceso, registro y panel de tutor en escritorio y de registro/cuenta/paneles en móvil. Capturas `tema-*.png`, `tutor-*.png`, `contact-account-*.png`, `panel-*.png` y `sprint3-*.png` dentro de `docs/evidencias/`.

Antes de las pruebas completas se reinició únicamente el proceso de API identificado por el PID del proyecto para iniciar una ejecución con el contador temporal por IP limpio. Se preservaron los bloqueos persistentes, los límites configurados, las credenciales, los datos existentes y el servicio PostgreSQL global. El primer barrido auxiliar de imágenes intentó desplazar una ilustración deliberadamente oculta en móvil; se ajustó ese barrido para revisar las imágenes visibles, sin cambiar el producto. Las cuentas de prueba se eliminaron al terminar.

## Fondo blanco, ancho adaptable y símbolos académicos, 11 de noviembre de 2026

Según el último ajuste solicitado se restauró el fondo blanco de la navegación pública/privada, la barra de acceso y los fondos generales. Se retiraron los degradados, puntos y círculos del fondo de la portada y de acceso/paneles. La franja de materias ahora toma la misma variable de color que el botón principal (`--button-orange`, #c65009), con texto e iconos blancos y hover blanco con texto morado. Se conservaron el cierre morado y las ilustraciones de la mascota.

La landing utiliza un contenedor adaptable hasta 1760 px, con márgenes proporcionales; el contenedor de los paneles se amplió hasta 1520 px. Los tamaños de texto y las columnas mantienen límites de lectura. Las barras y fondos de sección ocupan todo el ancho disponible.

Se añadieron ocho piezas académicas en relieve realizadas con HTML/CSS (π, llaves de código, integral, f(x), sumatoria, código, x² e infinito). Aparecen solamente después de la franja de materias, a los extremos y en los márgenes de las cuatro secciones. Flotan suavemente mediante transformaciones de 10–13 segundos, con baja intensidad visual. No reciben eventos de puntero ni entran en el árbol de accesibilidad; se mantienen detrás del contenido y se detienen con la preferencia de movimiento reducido. Las dos referencias visuales del usuario se conservaron sin modificaciones en `referencias/diseno/`.

Verificación: build aprobado, 72 pruebas de backend/API/cifrado/integridad aprobadas y batería completa de 34 casos de navegador aprobada (26 Chrome escritorio/móvil y 8 Firefox). Los casos de animación comprueban también la ubicación de los símbolos, ausencia en el hero, exclusión de la accesibilidad y de los eventos del puntero y desactivación por movimiento reducido.

Barrido visual adicional de portada, login y registro a 320, 393, 768, 1024, 1280, 1536, 1920 y 2560 px: sin desbordamientos, imágenes rotas, flechas decorativas ni errores de JavaScript; cuerpo y navegación blancos. Se verificaron igualdad exacta del naranja de franja/botón, texto blanco, hover blanco y cambio de posición de los símbolos a lo largo del tiempo. Las capturas de las secciones ocultan únicamente durante la captura el enlace fijo de salto cuando no tiene foco, para evitar un artefacto del recorte largo de Chromium; la interfaz conserva ese enlace de accesibilidad.

Evidencias en `docs/evidencias/`: `fondo-blanco-build.txt`, `fondo-blanco-backend.tap`, `fondo-blanco-navegadores.txt`, `fondo-blanco-geometria.txt`, `blanco-inicio.png`, `blanco-secciones.png` y `blanco-*.png`. Se reinició únicamente el proceso de API propio antes de la batería para limpiar sus contadores temporales de pruebas, conservando sesiones/bloqueos persistentes y configuración de seguridad. No hubo cambios de backend, tablas, credenciales ni servicios globales.

## Modos, alta de tutor y publicaciones con precio, 11 de noviembre de 2026

Se reorganizó el interior conforme a la solicitud del usuario: navegación contextual y cambio de modo también en el menú de la cuenta, sin selector duplicado debajo del saludo ni franja de comunidad. El estudiante conserva su cuenta y completa un cuestionario de cuatro etapas para ofrecer tutorías. Las materias y el nivel de dominio son declaraciones personales; no constituyen una prueba calificada ni una verificación institucional. Los perfiles de tutor anteriores conservan su acceso.

Se separaron el resumen del tutor, Mis publicaciones y el editor. Los botones de agregar son visibles; cada oferta tiene detalle propio. El usuario confirmó dólares por sesión. Los importes nuevos son obligatorios y se guardan como centavos enteros; los anteriores sin importe muestran Precio por acordar. Se añadió Eliminar filtros, sin filtro por semestre. Los contadores de publicaciones, activas y visitas proceden de PostgreSQL; se deduplica una visita por estudiante y día y se excluye al propietario. Mensajes, reservas y registro de ganancias siguen identificados como funciones pendientes; no se implementaron pagos ni se fabricaron datos económicos.

Ciudad y dirección son opcionales en el registro y el cuestionario, deben completarse juntas y pertenecen al contacto privado de la misma cuenta. La dirección conserva AES-256-GCM. El alta, las materias declaradas y los cambios académicos se guardan en una transacción. Se aplicaron las migraciones 006 y 007 únicamente en la instancia aislada del proyecto.

Validación final:

- Build Vite aprobado: `docs/evidencias/interior-build.txt`.
- 80 pruebas de backend, API, cifrado e integridad con PostgreSQL aprobadas: `interior-backend.tap`. Los ocho casos nuevos cubren contacto cifrado al registrarse, pares de contacto incompletos, perfil borrador sin permiso de publicar, validación y reversión transaccional del cuestionario, precios y unidad, privacidad del detalle, visitas con CSRF y visibilidad de publicaciones pausadas.
- Batería completa de 34 pruebas de navegador aprobada: 26 Chrome escritorio/móvil y 8 Firefox (`interior-navegadores.txt`). Incluye el recorrido de alta de tutor, cambio de modo en navegación y menú, conservación del rol estudiante y rechazo de administración, registro/contacto privado, publicaciones con importes exactos, edición, activación, desactivación, detalle, visita de otra cuenta y reinicio de filtros. Las cuentas temporales se eliminaron al finalizar.
- Comprobación adicional de siete pantallas interiores (explorar, resumen de tutor, publicaciones, agregar, perfil, cuestionario y detalle) a 320, 393, 768, 1024, 1280 y 1920 px: 42 combinaciones sin desbordamiento horizontal y sin errores JavaScript (`interior-geometria.txt`). Inspección visual de escritorio y móvil: `interior-final-*.png`; resumen con una publicación y una visita reales de la ejecución de pruebas: `interior-panel-completo-chromium.png`.

Para las capturas largas se cambia únicamente durante la captura la posición fija de la navegación y se oculta el enlace de salto cuando no tiene foco, evitando artefactos del ensamblado de Chromium. La aplicación conserva su navegación y su enlace de accesibilidad. Se corrigió además el desplazamiento al cambiar de ruta para que la nueva vista comience arriba. Un fallo inicial del selector de una prueba se resolvió usando el nombre accesible completo del enlace; la ejecución completa posterior pasó.

Se reinició únicamente la API propia antes de la batería para limpiar el contador temporal de registros por IP; no se alteraron límites de seguridad, bloqueos persistentes, contraseñas, sesiones ni el servicio PostgreSQL global. La revisión final retiró de la biografía de la cuenta ficticia existente una etiqueta DEMO antigua, conservando la aclaración de que son datos de prueba y verificando su persistencia mediante la interfaz. No se cambiaron sus precios ni estados de publicación. Recorridos y límites: `docs/FLUJO_INTERIOR.md`.


## Cuestionario a pantalla completa y controles compartidos, 11 de noviembre de 2026

El cuestionario de tutor ocupa una vista independiente, sin navegación de dashboard ni saludo repetido. Sus cuatro etapas conservan los datos al avanzar o volver, alternan naranja y blanco y muestran poses diferentes de la llama con símbolos decorativos suaves. Las materias se eligen mediante botones con estado accesible aria-pressed; la selección utiliza el naranja del botón principal con texto blanco y conserva el límite de diez y los niveles 1–5.

Se unificaron todos los desplegables de registro, perfil académico, cuestionario, publicaciones y filtros mediante Select.jsx: bordes redondeados, opciones naranjas, cierre exterior/Escape, navegación con flechas/Home/End y selección con Enter/Espacio. Se conserva un select nativo fuera de la interacción visual para validación y envío de formularios, con la interacción accesible en el combobox. Los botones de cambio de modo son naranjas con texto blanco y hover inverso. Mi cuenta muestra una llama grande en el espacio lateral y símbolos de movimiento lento, sin el recuadro informativo anterior.

Cero centavos se muestra como Gratuito. Los importes ausentes de publicaciones antiguas se distinguen como Precio pendiente, evitando declarar gratuito un servicio sin precio registrado. No hubo cambios de API ni de tablas.

Verificación: build aprobado (cuestionario-build.txt), 80 casos backend/PostgreSQL aprobados (cuestionario-backend.tap) y 36 casos de navegador aprobados: 28 Chrome escritorio/móvil y 8 Firefox (cuestionario-navegadores.txt). Los casos nuevos comprueban selección/hover naranja, teclado y cierre del desplegable; el alta comprueba la pantalla independiente y materias sin casillas. Barrido adicional de nueve vistas a seis anchos entre 320 y 1920 px, sin errores JavaScript ni desbordamientos finales (cuestionario-geometria.txt y cuestionario-cuenta-geometria.txt). Una comprobación inicial detectó un desbordamiento de los símbolos de Mi cuenta a 768/1024 px; se acotó su contenedor y se repitieron las doce combinaciones afectadas con resultado correcto. Se comprobó Gratuito en la vista previa al introducir cero sin modificar publicaciones existentes.

Inspección de las cuatro etapas en escritorio y de cuestionario/Mi cuenta/editor en móvil. Evidencias: cuestionario-etapa-*.png y cuestionario-final-*.png dentro de docs/evidencias/. La revisión no guardó el cuestionario de la cuenta existente ni alteró sus publicaciones, importes o credenciales.


## Cuestionario sin desplazamiento y jerarquía de tarjetas, 11 de noviembre de 2026

Se compactaron los espacios y campos del cuestionario según el ancho y la altura disponibles, sin recortar contenido mediante overflow oculto ni reducir por escala toda la pantalla. Las materias del catálogo se paginan en pantallas pequeñas y el dominio se completa una materia a la vez, conservando todas las selecciones y niveles. La revisión separa datos académicos, presentación y materias; los textos extensos y listas se recorren con botones. La validación lleva a la primera materia sin nivel cuando corresponde. Las acciones siguen visibles.

Los botones de perfil, campana y cambio de modo tienen 40 px de alto. Cada tarjeta muestra un icono específico junto a materia/título (bases de datos, estructuras, redes, programación, cálculo, matemáticas, física, química, estadística, idiomas y sistemas operativos, con libro como respaldo). La modalidad queda arriba a la derecha con etiqueta redondeada: virtual morada, presencial verde y ambas naranja. Se corrigieron los contextos de apilamiento del formulario de búsqueda y del desplegable abierto para que sus opciones reciban clics por delante de las tarjetas.

La revisión adicional usó una cuenta de prueba existente sin guardar su cuestionario ni alterar sus ofertas. Se comprobaron seis estados del cuestionario en ocho resoluciones: 1366×768, 1280×720, 1536×864, 393×851, 375×667, 320×568, 768×1024 y 1024×600. Con diez materias y una biografía extensa, las 48 combinaciones finales tienen altura de documento igual a la ventana y los botones dentro de ella. Se midieron los tres botones de navegación (40 px cada uno) y se verificó mediante elementFromPoint que una opción del menú está delante de las tarjetas. No hubo errores JavaScript. Evidencia: docs/evidencias/ajustes-geometria.txt y ajustes-*.png. Una revisión inicial detectó excesos a 320×568 y en la lista de revisión a 1024×600; se corrigieron mediante tamaños y paginación adaptados a la altura y se repitió el barrido completo.


Validación de cierre de este ajuste: build aprobado (ajustes-build.txt), 80 pruebas backend/PostgreSQL aprobadas (ajustes-backend.tap) y batería completa de 36 casos de navegador aprobada: 28 Chrome escritorio/móvil y 8 Firefox (ajustes-navegadores.txt). Se añadió al recorrido de alta la comprobación de altura del documento y visibilidad de las acciones en cada etapa. El desplegable calcula el espacio disponible y se abre hacia arriba cuando conviene, con altura limitada a la ventana. Después de ese ajuste se repitieron los dos casos específicos de desplegables (ajustes-desplegables-final.txt) y el barrido de ocho resoluciones, ahora también con semestres abiertos: 56 combinaciones sin desplazamiento del documento y con las opciones dentro de la ventana. La revisión mantuvo la API ligada a loopback y reinició únicamente el proceso propio para limpiar el contador temporal de registros de prueba por IP, sin cambiar límites ni bloqueos persistentes. Las cuentas temporales de las pruebas completas se eliminaron al finalizar.


## Corrección de tarjetas según anotaciones, 11 de noviembre de 2026

La referencia original se conserva en referencias/diseno/ajuste-tarjetas-modalidad-boton.png. La modalidad se colocó en la misma fila que la asignatura, a su derecha, utilizando el mismo naranja del botón Buscar y texto blanco. Se aumentaron tamaño y peso del título. Ver tutoría utiliza el botón primario naranja y se alinea a la derecha de una fila inferior que ocupa todo el ancho de la tarjeta; el precio permanece a la izquierda. Se conservaron los iconos por asignatura y la lógica de publicaciones.

Build aprobado (tarjetas-corregidas-build.txt) y 80 pruebas backend/PostgreSQL aprobadas (tarjetas-corregidas-backend.tap). Comprobación de navegador con la cuenta ficticia existente, sin modificar sus publicaciones, a 320, 393, 768, 1024, 1280 y 1920 px: sin desbordamiento; alineación vertical de modalidad/asignatura, posición derecha del botón, igualdad exacta del naranja con Buscar, texto blanco y jerarquía del título correctos en todas las tarjetas. Se abrió el detalle desde el botón; no hubo errores JavaScript. Evidencia: tarjetas-corregidas-navegador.txt y tarjeta-corregida-*.png. No se repitió la batería general de 36 casos para este cambio exclusivamente visual.


Ajuste final solicitado: Ver tutoría vuelve a blanco con borde y texto morado, conservando su ubicación inferior derecha. Virtual y presencial amplía su etiqueta en una sola línea; la asignatura usa elipsis cuando el ancho es reducido, conservando su texto completo en el documento. Se repitieron build y revisión de tarjetas en los seis anchos, con navegación al detalle correcta y sin desbordamiento ni errores JavaScript. Las evidencias tarjetas-corregidas-* corresponden a este resultado final.


## Búsqueda por nombre combinada con asignatura, 11 de noviembre de 2026

Por solicitud del usuario, Buscar materia se reemplazó por Buscar por nombre: q ahora busca una coincidencia parcial del título de la publicación y subjectId sigue filtrando por la asignatura del catálogo. Ambos criterios se aplican con AND, también al calcular el total y paginar; un criterio vacío no restringe por ese campo. No se busca el texto en la descripción ni en el nombre de la asignatura. Los filtros aplicados se muestran por separado y Eliminar filtros limpia ambos. Los enlaces de materias de la portada pasan por asignatura y se resuelven contra el catálogo autenticado, conservando su función de filtro.

Se mantuvo SQL parametrizado y búsqueda literal con strpos, de modo que % y _ no actúan como comodines. Se normalizan mayúsculas y tildes antes de comparar; el primer caso nuevo reveló que la configuración local de PostgreSQL no convertía Í mayúscula al usar lower antes de translate. Se corrigió traduciendo las letras acentuadas de ambos casos antes de lower y la batería final pasó.

Verificación: build aprobado (busqueda-nombre-build.txt); 81 pruebas backend/API/cifrado/integridad con PostgreSQL aprobadas (busqueda-nombre-backend.tap). El caso nuevo crea y elimina sus publicaciones en un esquema aislado, comprobando límites en dos materias, la combinación con Cálculo, asignatura sin nombre, exclusión de coincidencias solo en descripción/materia y caracteres literales/entrada de inyección. Batería completa de 36 casos de navegador aprobada (28 Chrome escritorio/móvil y 8 Firefox, busqueda-nombre-navegadores.txt); se amplió el recorrido de publicaciones con nombre parcial, asignatura correcta/incorrecta y reinicio. Comprobación adicional contra la API local final: enlaces de portada, limite + Cálculo, LÍMITES + Cálculo y limpieza de filtros, sin errores JavaScript ni modificar las ofertas existentes (busqueda-nombre-local.txt). Captura: busqueda-nombre-calculo.png.

Se reinició únicamente el proceso API identificado del proyecto para cargar el cambio del repositorio y limpiar los contadores temporales de las pruebas; no se alteraron bloqueos persistentes, sesiones almacenadas, límites de seguridad ni PostgreSQL global. Las cuentas de navegador temporales se eliminaron al terminar.
