# Una cuenta para aprender y ofrecer tutorías

Estado vigente desde el 10 de noviembre de 2026: además de editar este perfil, se pueden crear y gestionar publicaciones desde «Mis publicaciones» y buscarlas por asignatura en el panel de estudiante. Ver `SPRINT_3.md`. La presentación propia continúa siendo privada; las ofertas comparten solo nombre y datos académicos básicos, con la información escrita para la publicación.

Ampliación solicitada por el usuario el 31 de octubre de 2026. Se añade a la aplicación local y se distingue del alcance académico original de los sprints 1 y 2. No se modifica ningún documento original ni se inventan identificadores RF/HU.

## Modelo

`users` conserva la identidad, correo, contraseña y permiso de cuenta. `student_profiles` conserva universidad, carrera y semestre. La nueva tabla `tutor_profiles` guarda solo la información específica para presentarse como tutor:

| Campo        | Uso                                                         |
| ------------ | ----------------------------------------------------------- |
| `user_id`    | PK y FK a `users.id`: cero o un perfil de tutor por cuenta  |
| `headline`   | Especialidad o presentación breve, entre 2 y 100 caracteres |
| `bio`        | Presentación en texto, entre 20 y 1500 caracteres           |
| `created_at` | Fecha en que se crea el perfil                              |
| `updated_at` | Fecha del último guardado                                   |

La migración `003_tutor_profiles.sql` crea la tabla, sin convertir automáticamente a las cuentas existentes en tutores. Una cuenta se incorpora al crear voluntariamente su perfil desde el formulario. El guardado usa una operación atómica `INSERT ... ON CONFLICT` que evita perfiles duplicados incluso con peticiones simultáneas. La FK impide perfiles huérfanos y elimina el perfil al eliminar la cuenta.

Tutor no es un valor de `users.role`: una persona puede aprender y ofrecer con la misma cuenta. El permiso de administrador permanece independiente. Nombres, correo, contraseña y datos académicos se reutilizan desde sus tablas actuales; no se copian a la tabla de tutores.

## Interfaz y acceso

- `/dashboard`: panel de estudiante, con la exploración todavía informativa.
- `/dashboard/tutor`: panel de tutor, con creación y edición de su especialidad y presentación.
- El selector «Panel de estudiante / Panel de tutor» cambia de espacio sin cerrar sesión ni crear otra cuenta. El espacio seleccionado depende de la URL, no de un permiso guardado en el navegador.
- Crear un perfil no publica una oferta. Las publicaciones de tutorías, disponibilidad, solicitudes, reservas y pagos quedan pendientes.

`GET /api/tutor-profile` devuelve `{profile: null}` o el perfil propio. `PUT /api/tutor-profile` acepta exclusivamente `{headline, bio}` y devuelve el perfil persistido con código 200. Todas las peticiones requieren sesión activa y el guardado requiere CSRF y origen válido cuando se envía. La identidad se toma únicamente de la sesión, sin `userId` en la URL o en el cuerpo. Validación estricta rechaza intentos de inyectar identidad, rol o campos extra.

Los textos se presentan como texto React, sin HTML interpretado. No hay catálogo público de perfiles ni endpoint para consultar perfiles de terceros. La pantalla incluye estados de carga, error, reintento y confirmación de guardado. La privacidad informa del nuevo uso de datos.

## Protección de datos

`headline` y `bio` se almacenan como texto legible; esta ampliación no implementa AES ni otro cifrado de campos. Las contraseñas continúan protegidas con Argon2id exclusivamente en `users.password_hash` y nunca se copian al perfil o a la sesión. La API del perfil no devuelve correo, contraseña ni hash. No se utilizan datos ficticios como tutores reales.

## Demostración

1. Iniciar la aplicación y acceder con una cuenta propia.
2. Abrir «Panel de tutor», completar la especialidad y la presentación y pulsar «Crear mi perfil de tutor».
3. Recargar y comprobar que aparecen los mismos textos; editar y guardar.
4. Volver al panel de estudiante y comprobar que se conserva el nombre y la sesión.
5. En pgAdmin, usar la conexión «Tutorias - Proyecto local (5433)» → `tutorias_local` → Schemas → public → Tables. Actualizar la lista para ver `tutor_profiles` y consultar la fila creada. La tabla permanece vacía hasta que una persona crea su perfil.

Las pruebas y sus resultados se registran en `PRUEBAS_REALIZADAS.md`.

Ampliación de datos privados: el panel incluye también ciudad y dirección, compartidas con «Mi cuenta» mediante `user_contact_details`. No hay campo campus. La dirección sí se cifra con AES-256-GCM; `headline` y `bio` continúan como texto legible. El contrato `{headline, bio}` del perfil de tutor no cambia y no incluye contacto. Ver `DIRECCION_CIFRADA.md`.
