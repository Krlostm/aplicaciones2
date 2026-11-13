# Estado real de los sprints 1, 2 y 3

Actualización del 10 de noviembre de 2026: sprint 3 implementado localmente (HU-03, HU-04, HU-05 y HU-08), según semanas 5–6 del backlog. Perfil académico editable, publicaciones propias con edición/activación/desactivación y búsqueda por asignatura. Contraseñas mínimo 8 y bloqueo persistente de 15 minutos tras 5 fallos en 15 minutos. Ver `SPRINT_3.md` y `POLITICA_SEGURIDAD.md`. Los párrafos siguientes conservan el historial de entregas; no representan que estas funciones sigan pendientes.

Verificación actual: 104 casos aprobados (72 backend/cifrado, 24 Chrome escritorio/móvil y 8 Firefox), build, migración idempotente, cuatro consultas de demostración, auditoría npm sin vulnerabilidades reportadas y bloqueo tras reiniciar realmente la API. Evidencias y límites en `PRUEBAS_REALIZADAS.md`.

Entrega local del 28 de octubre de 2026. El recorrido prioritario está implementado y comprobado: portada → registro → PostgreSQL → login → panel con nombre real → recarga → logout → denegación de acceso sin sesión.

## Historias y estado

| Historia | Estado                            | Alcance verificado y pendiente                                                                                                                                                                                                                 |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HT-01    | Verificado                        | Entorno, dependencias, instalación limpia con lockfile, Git, configuración, lanzador y versiones                                                                                                                                               |
| HT-02    | Verificado                        | Tres capas, HTTP/JSON, separación de responsabilidades y diagrama                                                                                                                                                                              |
| HT-05    | Verificado                        | Adaptación Stitch, registro/login, panel protegido, componentes y cliente HTTP; Chromium/Firefox y móvil                                                                                                                                       |
| HT-11    | Parcial                           | Investigación oficial entregada; viabilidad contractual, costos no publicados, liquidación para este modelo y sandbox pendientes                                                                                                               |
| HT-03    | Parcial en conformidad documental | PostgreSQL, migraciones, repositorios, restricciones y núcleo de autenticación verificados; DER conceptual futuro documentado. Falta resolver la ERS de RF-01 a RF-18 declarada por el backlog, pues el archivo adjunto contiene RF-01 a RF-14 |
| HT-04    | Verificado en entorno local       | Argon2id, validación, sesiones PostgreSQL, permisos, CSRF, cookie HttpOnly/SameSite, rotación y logout. Secure preparado para producción; HTTPS de despliegue queda en HT-10                                                                   |
| HU-01    | Verificado                        | Registro persistente, errores por campo, correo único, contraseña protegida y confirmación                                                                                                                                                     |
| HU-02    | Verificado                        | Login, nombre real, sesión tras recarga, permisos y cierre efectivo                                                                                                                                                                            |

Resultado: seis historias verificadas localmente y dos parciales por los pendientes indicados. El carácter parcial documental de HT-03 no impide el funcionamiento del registro/login. No se asignan puntos de historias parciales como si tuvieran aceptación académica completa.

## Servicios entregados

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:4000/api/health
- PostgreSQL: `127.0.0.1:5433`, base `tutorias_local`, versión 17.6, conexión real verificada.
- PostgreSQL global del puerto 5432: conservado; no se modificó su servicio ni sus credenciales.
- Inicio posterior: doble clic en `Iniciar Tutorias.cmd`.
- Consulta para profesor: doble clic en `Ver base de datos.cmd`.

La API y Vite se dejaron como procesos locales en segundo plano, con sus registros en `.local/`. La base conserva sus datos entre arranques. No hay cuentas de demostración preinstaladas: crear una cuenta propia desde la interfaz.

## Implementación entregada

`frontend/src/pages/Landing.jsx`, `Auth.jsx` y `Dashboard.jsx` contienen las pantallas; `components` reutiliza controles y layouts; `context/AuthContext.jsx` y `services/http.js` administran sesión e intercambio HTTP. `backend/src` implementa rutas, middleware, controladores, servicios y repositorios; `backend/migrations/001_identity.sql` y `scripts/migrate.js` preparan persistencia reproducible. Las pruebas están en `backend/tests`, `tests/e2e` y `tests/firefox`. README.md y los documentos de docs describen operación, criterios y evidencia.

Los originales académicos y de Stitch siguen en `referencias/`. Las fuentes y la imagen de la aplicación se sirven localmente. No se publicó la aplicación en Internet.

## Evidencias y aceptación pendiente

Ampliación posterior solicitada el 31 de octubre de 2026: perfil opcional de tutor en `tutor_profiles` y paneles separados de estudiante y tutor dentro de la misma sesión. Se puede crear, consultar y editar únicamente el perfil propio. No duplica credenciales ni cambia el permiso de estudiante; no incorpora publicaciones, reservas, mensajes ni pagos. Se documenta en `PERFIL_TUTOR.md` y se verifica separadamente en `PRUEBAS_REALIZADAS.md`. No altera la numeración ni la aceptación de las historias académicas de los sprints 1 y 2.

La entrega original aprobó 55 casos automáticos, más build, instalación limpia, API/DB, migración y auditoría de dependencias. La ampliación del perfil de tutor aprobó 67 casos (41 API, 18 Chrome escritorio/móvil y 8 Firefox), además de build y migración. Ver PRUEBAS_REALIZADAS.md para las fechas, el desglose y las incidencias corregidas.

Para aceptación completa de los ocho elementos: resolver la versión académica de la ERS y validar HT-11 con la cuenta y el modelo comercial que el proveedor acepte. No es necesario implementar funciones de otros sprints para dar por válido el registro y acceso actuales. La guía de demostración explica el recorrido y los archivos para revisión del docente.

Ampliación posterior de ciudad/dirección: campos separados, sin campus, compartidos por «Mi cuenta» y el panel de tutor mediante `user_contact_details`. La dirección se cifra con AES-256-GCM en el backend y solo se devuelve a su propietario; la ciudad se conserva legible. La clave se protege con DPAPI fuera de PostgreSQL. Build, migración y 86 casos aprobados (51 API/PostgreSQL, 7 cifrado/DPAPI, 20 Chrome escritorio/móvil y 8 Firefox). Ver `DIRECCION_CIFRADA.md` y la última sección de `PRUEBAS_REALIZADAS.md`. No cambia la aceptación de historias académicas futuras.
