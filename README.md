# Tutorías Red Académica

Aplicación local de tesis de Carlos Javier Toa Chávez. Implementa los sprints 1, 2 y 3 con el estilo de los diseños Stitch adjuntos: registro y sesiones, edición del perfil, publicaciones de tutorías y búsqueda por asignatura.

- Aplicación: http://127.0.0.1:5173
- API: http://127.0.0.1:4000/api/health
- PostgreSQL del proyecto: `127.0.0.1:5433`, base `tutorias_local`.
- Inicio con doble clic: **Iniciar Tutorias.cmd**. No requiere copiar comandos ni introducir la contraseña del PostgreSQL global.
- El servicio PostgreSQL existente del puerto 5432 se conserva sin cambios.

## Recorrido funcional

Actualización del 10 de noviembre de 2026: en «Mi cuenta» se edita el perfil académico. En «Panel de tutor» → «Mis publicaciones» se crean, editan, activan y desactivan ofertas. En el panel de estudiante se buscan por asignatura. Contraseñas de 8 a 128 caracteres, con rechazo básico de claves comunes, y bloqueo por cuenta de 15 minutos tras 5 fallos dentro de 15 minutos, persistido en PostgreSQL. Ver `docs/SPRINT_3.md` y `docs/POLITICA_SEGURIDAD.md` para alcance y justificación.

Portada → Crear cuenta → confirmación → Iniciar sesión → panel con el nombre y la universidad registrados → recargar → menú del usuario → Cerrar sesión → acceso al panel denegado.

Ampliación solicitada el 31 de octubre de 2026: una misma cuenta accede al **Panel de estudiante** (`/dashboard`) y al **Panel de tutor** (`/dashboard/tutor`). En el segundo puede crear y editar su especialidad y presentación, persistidas en `tutor_profiles`. El perfil es opcional, conserva la identidad y el acceso de estudiante y todavía no se publica en un catálogo. Ver `docs/PERFIL_TUTOR.md`.

La instalación no precarga cuentas ni ofertas. Por solicitud del 11 de noviembre de 2026 se preparó un conjunto local opcional de ejemplos, identificado explícitamente como DEMO; su guía, credencial protegida y datos están en `.local/pruebas-sprint3/`, excluidos de Git. Los usuarios de las pruebas automáticas son distintos y se eliminan al terminar. No se usa autenticación en localStorage ni se envían correos o realizan pagos. El registro admite correos válidos sin restringir dominios universitarios, porque los documentos no definen una lista aprobada ni verificación por correo en estos sprints.

## Estructura

`frontend/src` contiene presentación React, componentes, formularios, contexto de sesión y cliente HTTP. `backend/src` separa rutas, controladores, servicios, repositorios y middleware. `backend/migrations` contiene las migraciones versionadas. `referencias` conserva los originales. `docs` registra alcance, arquitectura, evidencia y observaciones académicas.

## Entorno de desarrollo

Se usaron Node.js 22.16.0, npm 11.4.1, Git 2.49.0.windows.1 y los binarios oficiales ya instalados de PostgreSQL 17.6. Las versiones exactas npm están fijadas en `package-lock.json` y registradas en `docs/VERSIONES.md`.

Para mantenimiento técnico, los scripts disponibles son `npm ci`, `npm run db:setup`, `npm run db:migrate`, `npm run dev`, `npm run build`, `npm test` y `npm run test:e2e`. El lanzador ejecuta el arranque por el usuario. La suite E2E requiere los servidores activos. Usa Chrome instalado mediante Playwright y Firefox instalado mediante Puppeteer/WebDriver BiDi. En otra máquina Windows se puede indicar FIREFOX_PATH para seleccionar el ejecutable. Los comandos describen reproducibilidad, no tareas pendientes para quien recibe esta entrega.

Los secretos locales están en `backend/.env`, fuera de Git. `.env.example` es una plantilla sin credenciales. `.local/postgres-data` contiene los datos persistentes de la instancia propia. No borrar esa carpeta para reiniciar la aplicación.

Ciudad y dirección se editan en «Mi cuenta» o en el panel de tutor y se comparten entre ambos. La ciudad se guarda por separado; la dirección se cifra con AES-256-GCM en `user_contact_details`, sin campus. `db:setup` conserva la clave protegida con Windows DPAPI en `.local/address-key.xml`, fuera de Git y PostgreSQL. Conservar este archivo y el usuario/equipo Windows: la base por sí sola no permite descifrar las direcciones. Ver `docs/DIRECCION_CIFRADA.md`.

## Alcance y límites

El registro, sesiones, perfil académico, perfil de tutor, publicaciones y búsqueda por asignatura son funcionales. La ciudad/dirección siguen siendo privadas y la dirección se conserva cifrada. Horarios, PDF, reservas, compatibilidad, mensajes, administración funcional y pagos pertenecen a incrementos posteriores y no se simulan. El catálogo inicial contiene asignaturas de referencia, sin ofertas ficticias precargadas.

Ver `docs/ESTADO_IMPLEMENTACION.md`, `docs/PRUEBAS_REALIZADAS.md` y `docs/OBSERVACIONES.md`. La investigación de HT-11 está en `docs/EVALUACION_PASARELAS_ECUADOR.md`. No se realizó despliegue público, configuración HTTPS ni evaluación de carga/ISO 25010.

El recorrido interior actual (modos, cuestionario de tutor, publicaciones propias, precio en USD por sesión y detalle) está descrito en [docs/FLUJO_INTERIOR.md](docs/FLUJO_INTERIOR.md).
