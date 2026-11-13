# Guía para demostrar registro y autenticación

La guía vigente de sprint 3 está en `SPRINT_3.md`. La contraseña mínima actual es 8 caracteres; se recomiendan frases largas y se rechazan algunas claves comunes. «Mi cuenta» ahora permite editar el perfil y «Mis publicaciones» permite publicar/editar/activar/desactivar; las indicaciones de abajo que lo situaban en un sprint siguiente describen la entrega anterior. Para justificar y demostrar el bloqueo, usar `POLITICA_SEGURIDAD.md` y una cuenta de prueba independiente.

La demostración usa cuentas creadas durante la presentación, guardadas en PostgreSQL. No requiere una cuenta ficticia preparada ni ejecutar SQL manualmente.

1. Abrir **Iniciar Tutorias.cmd** si los servidores no están activos. El lanzador enciende la base propia y ambos servidores, verifica su respuesta y abre la aplicación. La dirección es http://127.0.0.1:5173.
2. Mostrar la portada: composición, imagen, fuentes y paleta proceden de Stitch. Los HTML originales están en `referencias/stitch/`; no fueron sobrescritos.
3. Elegir **Crear cuenta**. Introducir nombres, apellidos, un correo nuevo válido, universidad, carrera, semestre y una contraseña de al menos 8 caracteres, preferentemente una frase larga. Confirmarla y leer/aceptar el aviso de privacidad. No usar la contraseña de otro servicio.
4. Crear la cuenta. Mostrar la confirmación en el login. Abrir **Ver base de datos.cmd** para enseñar que la cuenta y su perfil existen en `tutorias_local`. El informe muestra si hay hash Argon2id, sin revelar el hash ni la contraseña.
5. Volver a registro e intentar el mismo correo: se presenta el error de duplicado. Mostrar también un dato obligatorio vacío o la confirmación diferente.
6. En login probar primero una contraseña equivocada. La aplicación rechaza el acceso con un mensaje comprensible.
7. Ingresar con la contraseña correcta. Mostrar el saludo con el nombre real y la universidad. Recargar la página: sigue autenticado porque la sesión está en PostgreSQL.
8. Elegir **Ver mi cuenta**, editar el perfil académico (HU-03), guardar y recargar. Abrir «Panel de tutor», completar el perfil y demostrar «Mis publicaciones»: crear (HU-04), editar/desactivar/reactivar (HU-05) y buscar por asignatura desde el panel de estudiante (HU-08). El recorrido detallado está en `SPRINT_3.md`.
9. Abrir el menú del nombre/iniciales, arriba a la derecha, y elegir **Cerrar sesión**. Se confirma la salida. Visitar http://127.0.0.1:5173/dashboard: se exige login.
10. Abrir PRUEBAS_REALIZADAS.md y las capturas en `docs/evidencias/`. Explicar que las pruebas API también reusan una cookie después del logout y verifican que ya no tiene acceso.

## Ver los registros directamente en pgAdmin

Para demostrar los datos privados añadidos posteriormente, abrir «Mi cuenta», guardar una ciudad y una dirección ficticia, recargar y consultar los mismos datos en el panel de tutor. `user_contact_details` guarda la ciudad por separado y la dirección cifrada con AES-256-GCM. La consulta SQL de demostración muestra únicamente si hay dirección cifrada y su longitud, sin descifrarla. El formulario no incluye campus. Ver `DIRECCION_CIFRADA.md`.

Se añadió la conexión **Tutorias - Proyecto local (5433)** al pgAdmin instalado, conservando la conexión PostgreSQL 17 del puerto 5432. La base del proyecto aparece dentro de esa conexión como **tutorias_local**. Las tablas están en **Schemas → public → Tables**: `users`, `student_profiles`, `tutor_profiles`, `user_contact_details`, `auth_sessions` y `schema_migrations`. Actualizar la lista de tablas para ver las incorporadas posteriormente; sus registros aparecen cuando una cuenta guarda los formularios correspondientes.

Para una consulta legible y sin hashes ni cookies, usar el Query Tool de **tutorias_local** y abrir `docs/CONSULTAS_DEMOSTRACION.sql`. Los nombres físicos de las columnas son `first_name`, `last_name` y `email`; el SQL proporciona alias en español y une usuario con perfil académico. Se verificó el registro real existente de Carlos Toa, Software, semestre 8, dentro de pgAdmin.

La conexión usa el rol de la aplicación `tutorias_app`, no la contraseña del usuario `postgres` del servicio global. Su archivo de credenciales es `.local/pgadmin-tutorias.pgpass`, excluido del repositorio; no compartirlo ni mostrarlo durante la exposición.

## Archivos para justificar la arquitectura

Abrir `docs/ARQUITECTURA.md`, `frontend/src/services/http.js`, `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`, `backend/src/services/auth.service.js`, `backend/src/repositories/user.repository.js` y `backend/migrations/001_identity.sql`, en ese orden. La pantalla captura la interacción; las rutas/controladores atienden HTTP; el servicio aplica reglas; el repositorio ejecuta SQL parametrizado.

El modelo físico y el futuro conceptual están en BASE_DE_DATOS.md. La trazabilidad está en MATRIZ_TRAZABILIDAD.md. La investigación de pagos es solo HT-11; no mostrarla como integración funcional.

## Precisiones académicas

La ERS disponible tiene catorce RF y el backlog declara dieciocho. Mostrar OBSERVACIONES.md sin modificar la fuente original. Las pruebas funcionales no demuestran todavía las metas estadísticas de rendimiento o disponibilidad ni certifican ISO 25010. El resultado de cada historia y los pendientes se declaran en ESTADO_IMPLEMENTACION.md.

## Recorrido interior actualizado

Para la demostración del interior usa la guía `docs/FLUJO_INTERIOR.md`: registro de estudiante con contacto opcional, Conviértete en tutor, cuestionario, cambio de modo en navegación/menú, Agregar una tutoría, precio en USD por sesión, detalle y Mis publicaciones. La antigua lista/formulario al final del perfil fue sustituida por pantallas separadas. Los contadores son reales; no presentar mensajes, reservas o ganancias como funciones operativas.
