# Sprint 3: perfil, publicaciones y búsqueda

Implementado por solicitud del 10 de noviembre de 2026. Fuente: `referencias/Toa_HU_HT_ProductBacklog.pdf`, plan incremental de la página 22, semanas 5–6: HU-03, HU-04, HU-05 y HU-08, 16 puntos planificados. Los puntos no constituyen una medición de esfuerzo ni una aceptación del docente. Se conservan los documentos originales y sus contradicciones de numeración con la ERS.

| Historia        | Comportamiento implementado                                                                                                                       | Verificación                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| HU-03, 3 puntos | Consulta y edición de nombres, apellidos, universidad, carrera y semestre 1–8. Correo, contraseña y permisos no se modifican con este formulario. | Persistencia tras recarga, errores por campo, rechazo de semestre 9 y campos de identidad/privilegio enviados por el cliente. |
| HU-04, 5 puntos | Crear tutorías con asignatura del catálogo, título, descripción y modalidad virtual/presencial/ambas. Requiere crear antes el perfil de tutor.    | Registro real en PostgreSQL, asignatura inexistente rechazada, campos obligatorios y autor tomado de la sesión.               |
| HU-05, 3 puntos | Listar, editar, activar y desactivar las publicaciones propias.                                                                                   | Una segunda cuenta no puede modificarlas; las desactivadas desaparecen de la búsqueda y pueden reactivarse.                   |
| HU-08, 5 puntos | Buscar ofertas activas por texto de asignatura o selección del catálogo, sin distinguir mayúsculas ni tildes, con resultado vacío y paginación.   | Búsqueda real en dos motores de navegador, texto sin coincidencias, SQL tratado como dato y exclusión de cuentas inactivas.   |

## Uso

1. Iniciar la aplicación con `Iniciar Tutorias.cmd` y acceder.
2. En «Mi cuenta», usar «Actualizar perfil académico», guardar y recargar.
3. Abrir «Panel de tutor». Completar su perfil si aún no existe y bajar a «Mis publicaciones».
4. Seleccionar una asignatura, escribir título y descripción, elegir modalidad y pulsar «Publicar tutoría».
5. En el panel de estudiante, buscar esa asignatura; por ejemplo, `programacion` encuentra `Programación`.
6. Volver al panel de tutor, editar la oferta, desactivarla y comprobar que ya no aparece en la búsqueda. Reactivarla vuelve a ofrecerla.

El catálogo inicial contiene nombres de asignaturas de referencia; no crea tutores, ofertas o estadísticas ficticias. Las pruebas publican temporalmente con cuentas `example.test` y retiran esas cuentas y sus publicaciones al finalizar.

## Implementación

Se conserva React → cliente HTTP → rutas → controladores → servicios → repositorios → PostgreSQL. La migración `005_sprint_three.sql` agrega `subjects`, `publications` y `auth_login_attempts`, sin modificar las migraciones aplicadas ni las cuentas existentes.

- `users` y `student_profiles` se actualizan en una transacción para HU-03.
- `publications.tutor_id` referencia `tutor_profiles.user_id`: una cuenta sigue pudiendo aprender y ofrecer; no se agrega un rol exclusivo de tutor.
- `publications.subject_id` referencia el catálogo. Título 5–120 caracteres, descripción 20–2000, modalidad enumerada y estado booleano.
- Toda modificación incluye el propietario de la sesión en la condición SQL. Un identificador ajeno o inexistente devuelve 404 sin revelar su propietario.
- Búsqueda parametrizada con normalización de mayúsculas/tildes y límite de 12 resultados por página. Solo devuelve datos de la oferta y nombre, apellido, universidad y carrera; omite correo, dirección, ciudad privada, contraseña, claves y sesión.
- En el navegador, las publicaciones y nombres se muestran como texto React, sin interpretar HTML proporcionado por usuarios. La interfaz conserva los datos del formulario ante errores.

## API

| Ruta                                               | Acceso y resultado                                          |
| -------------------------------------------------- | ----------------------------------------------------------- |
| PUT `/api/auth/profile`                            | Sesión y CSRF; actualiza únicamente el perfil propio        |
| GET `/api/publications/subjects`                   | Sesión; catálogo académico                                  |
| GET `/api/publications/mine`                       | Sesión; ofertas propias con sus estados                     |
| POST `/api/publications`                           | Sesión, CSRF y perfil de tutor; crea una publicación activa |
| PUT `/api/publications/:id`                        | Sesión, CSRF y propiedad; edita datos de la oferta          |
| PATCH `/api/publications/:id/state`                | Sesión, CSRF y propiedad; recibe `{isActive: true/false}`   |
| GET `/api/publications?q=...&subjectId=...&page=1` | Sesión; búsqueda, total real, página y tamaño de página     |

## Seguridad y alcance

Se ajustó el mínimo de contraseña a 8 caracteres a pedido del usuario y se agregó bloqueo persistente tras 5 fallos, durante 15 minutos. La justificación y sus límites están en `POLITICA_SEGURIDAD.md`. Argon2id, AES-256-GCM para direcciones, DPAPI, sesiones PostgreSQL, CSRF y cookies HttpOnly/SameSite continúan funcionando.

Las reservas, disponibilidad, PDF, mensajería, compatibilidad por horario, geolocalización, administración funcional y pagos pertenecen a sprints siguientes. HU-09, consulta ampliada del tutor con disponibilidad, no se declara implementada por mostrar los datos básicos de la oferta. No se realiza despliegue ni se afirma cumplimiento ISO o NIST. Resultados medidos en `PRUEBAS_REALIZADAS.md`.
