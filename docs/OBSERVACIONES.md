# Observaciones de fuentes y control académico

Fecha de revisión: 28 de octubre de 2026, Ecuador. Los documentos originales no se modificaron.

## Discrepancia principal de numeración

La ERS adjunta `referencias/Toa_especificacion_requisitos_IEEE830.pdf` (revisión 1.0, septiembre de 2026) contiene RF-01 a RF-14. Su apéndice, página 11, confirma ese rango. El backlog final declara una ERS con RF-01 a RF-18 y cambia la correspondencia a partir de RF-05. El pedido también menciona dieciocho requisitos originales.

No existe en este workspace una ERS original con RF-15 a RF-18. No se crean ni se renumeran esos requisitos. Para RF-01 y RF-02 no hay conflicto: registro y autenticación conservan su identificación en ambos documentos. La matriz distingue expresamente ambos esquemas para las funcionalidades posteriores. Corresponde al autor/docente determinar cuál versión de la ERS está aprobada antes de desarrollar esas funcionalidades.

## Ampliaciones

La arquitectura y la ERS excluyen pagos integrados de la primera versión. El backlog posterior propone RF-P01 a RF-P05 y las historias de propuestas y pagos. Se mantiene su carácter de propuesta; HT-11 es investigación documental. No se implementan cobros, retención de fondos ni comisión propia.

## Diseño Stitch y afirmaciones no comprobadas

Los originales contienen nombres, calificaciones, cantidades de tutores, testimonios, una garantía de aprobación del 94,2 %, validación SENESCYT, custodia de fondos, abonos bancarios, ganancias estimadas y fechas 2025. Esas afirmaciones no están respaldadas por datos de la aplicación ni por criterios de los sprints 1 y 2.

La adaptación conserva la paleta, las fuentes, la imagen académica original, la composición editorial, tarjetas, filtros laterales y navegación responsive. Se sustituyeron los contenidos comerciales no verificados por información sobre la comunidad y estados vacíos honestos. No se presenta una alianza institucional con las universidades mencionadas. Los originales permanecen íntegros en `referencias/stitch/`.

## Casos de uso

Se encontraron referencias a CU en la ERS y el backlog, pero ningún documento independiente de casos de uso. No se inventó su contenido. HU-01 y HU-02 conservan las referencias CU-01 y CU-02.

## Decisiones de implementación

Se solicitaron nombre, apellidos, correo, universidad, carrera, semestre, contraseña y aceptación del aviso de privacidad. Las fuentes no proporcionan un diccionario aprobado de campos; esta es una decisión técnica explícita y revisable, sin verificación ficticia de correo institucional.

Se usa una única cuenta estudiante con perfil académico. Solicitar u ofrecer son actividades futuras de esa identidad; administrador es un permiso separado que no se puede elegir al registrar una cuenta.

PostgreSQL 17.6 estaba instalado y activo en 5432, sin credenciales disponibles. Se reutilizaron sus binarios para una instancia aislada ligada a 127.0.0.1:5433, con rol de aplicación sin privilegios globales. No se alteró el servicio existente ni su autenticación. HTTP es exclusivamente local; HTTPS queda para el despliegue futuro HT-10.
