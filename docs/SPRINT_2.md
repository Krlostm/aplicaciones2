# Sprint 2 Persistencia y acceso

Plan original: semanas 3–4, 26 puntos. Las dependencias y puntos se conservan.

HT-03 (8 puntos), dependiente de HT-02, prepara PostgreSQL real y migraciones reproducibles. Se implementaron usuarios, perfil académico uno a uno, sesiones y registro de migraciones. Los repositorios usan parámetros y transacciones. El modelo conceptual incluye las entidades de módulos posteriores y distingue su estado planificado del esquema físico. Las pruebas verifican conexión, inserciones, recuperación, unicidad, FK y restricciones. Estado: núcleo del sprint verificado; cobertura formal de RF-01 a RF-18 pendiente de resolver la ERS faltante, sin inventar requisitos.

HT-04 (8 puntos), dependiente de HT-02/HT-03, implementa hash Argon2id, validación Zod, sesiones persistentes, cookies HttpOnly/SameSite y CSRF ligado a sesión. Login regenera identificador y token. El middleware consulta el usuario activo y comprueba permisos. Logout destruye la fila de sesión y la cookie anterior deja de servir. Secure se activa en producción. No se usa ubicación; por tanto no hay captación sin consentimiento. Estado: verificado en HTTP local; el HTTPS del despliegue corresponde a HT-10.

HU-01 (5 puntos), dependiente de HT-03/HT-04/HT-05, mantiene RF-01 y CU-01. CA1: datos válidos crean cuenta y perfil en PostgreSQL. CA2: un correo duplicado, incluso con mayúsculas o espacios, se rechaza con 409. CA3: los errores se muestran por campo y el formulario conserva datos. React confirma éxito y dirige a login. Archivos: `frontend/src/pages/Auth.jsx`, middleware/validation, auth.service, user.repository y migración. Estado: verificado mediante API y navegador.

HU-02 (5 puntos), dependiente de HU-01/HT-04/HT-05, mantiene RF-02 y CU-02. CA1: credenciales correctas dan acceso según identidad y permiso. CA2: credenciales incorrectas usan respuesta genérica. CA3: sin sesión no se accede a `/api/auth/me` ni al panel. CA4: cerrar sesión destruye el acceso, incluso reutilizando la cookie anterior. La recarga recupera nombre y universidad de la cuenta real. Estado: verificado mediante API y navegador según PRUEBAS_REALIZADAS.md.

No se incluyeron edición de perfil HU-03, publicaciones HU-04/HU-05, búsqueda HU-08, horarios, mensajes, gestión de tutorías o pagos. Las pantallas informativas reservan la navegación sin declarar esas historias completadas.

Ampliación posterior solicitada el 31 de octubre de 2026: se añadió un perfil de tutor opcional y editable y un selector entre paneles de estudiante y tutor. No se declara HU-03 completada por esta ampliación; la edición del perfil académico continúa pendiente. Los detalles están en `PERFIL_TUTOR.md`.
