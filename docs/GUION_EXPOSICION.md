# Guion de exposición de los tres primeros sprints

## Incremento del sprint 3

«El tercer sprint incorpora las historias HU-03, HU-04, HU-05 y HU-08 del plan de semanas 5–6. Edito mi perfil académico, creo una publicación con una asignatura válida y la encuentro desde el panel de estudiante. Puedo editarla o desactivarla; la desactivación la retira de la búsqueda. Otra cuenta no puede modificar mi publicación porque la propiedad se comprueba en el servidor y en la condición SQL.»

Mostrar «Mi cuenta», «Panel de tutor» → «Mis publicaciones», búsqueda por asignatura, desactivación y búsqueda vacía. Usar `CONSULTAS_SPRINT_3.sql` para revisar las tablas sin mostrar credenciales o direcciones.

«La contraseña mínima solicitada para el piloto es de ocho caracteres, aunque recomiendo frases largas. Cinco errores dentro de quince minutos bloquean nuevos inicios de sesión por quince minutos. Cinco deja margen a errores de escritura y limita una secuencia automatizada; quince minutos introduce una espera significativa con recuperación automática. Son decisiones iniciales del proyecto, no valores universales impuestos por una norma. El bloqueo se guarda en PostgreSQL y sobrevive a recargas, cookies nuevas y reinicios de la API. Durante la espera, nuevos intentos no prolongan el vencimiento.»

Abrir `POLITICA_SEGURIDAD.md` para justificar umbral, ventana, duración, límite adicional por IP y sus limitaciones. No afirmar que ocho caracteres sin MFA cumple el mínimo NIST vigente para contraseña como único factor. Explicar que Argon2id y AES-256-GCM siguen teniendo propósitos diferentes: verificar contraseñas y recuperar direcciones privadas, respectivamente.

El resto de este guion conserva la explicación de los incrementos anteriores. Las menciones a perfil/publicaciones como trabajo futuro corresponden a la entrega anterior y quedan sustituidas por la demostración del sprint 3.

## Contexto y objetivo

“Mi proyecto desarrolla una aplicación web para gestionar tutorías académicas entre estudiantes universitarios. Los primeros dos sprints construyen la base técnica, las interfaces y el acceso seguro que necesitan los demás módulos.”

## Diseño y primer sprint

“Conservé la identidad de los prototipos Stitch: azul marino, naranja, fondos lavanda y tipografías Epilogue y Geist. La portada, registro y login usan componentes React compartidos. La arquitectura tiene presentación, lógica de negocio y persistencia, con una API REST entre navegador y servidor.”

Mostrar la portada y ARQUITECTURA.md. Abrir el cliente HTTP y un repositorio para evidenciar que React no conoce la base de datos.

“HT-11 compara proveedores de pago para Ecuador. Es investigación; los pagos y las propuestas son ampliaciones pendientes. No cobramos una comisión propia y no hemos implementado retención de fondos.”

## Persistencia y segundo sprint

“Creo una cuenta nueva desde React. El servidor valida los datos y crea usuario y perfil en una transacción PostgreSQL. El correo tiene una restricción única y la contraseña se almacena con Argon2id.”

Ejecutar registro y mostrar Ver base de datos.cmd. Intentar correo duplicado y contraseña incorrecta.

“Al entrar, el servidor regenera una sesión guardada en PostgreSQL y envía una cookie HttpOnly. El panel consulta mi identidad real. Al recargar, conserva el acceso. Cuando cierro sesión, el servidor elimina esa sesión; la misma cookie deja de ser válida.”

Mostrar saludo, recarga, cierre y denegación al volver al panel. Explicar que un estudiante puede solicitar u ofrecer sin duplicar su cuenta, y que no puede elegir ser administrador en el registro.

Si se muestra la ampliación solicitada el 31 de octubre de 2026: alternar entre el panel de estudiante y el de tutor, crear una presentación, recargar y mostrar la fila de `tutor_profiles`. Explicar que es un perfil opcional ligado a `users.id`, sin otra contraseña ni modificación de permisos. Su creación no publica una oferta ni completa las historias académicas futuras.

## Evidencias y límites

Abrir PRUEBAS_REALIZADAS.md. Indicar los resultados de las pruebas API y de navegador con sus conteos reales. Mostrar capturas desktop/móvil.

“Las publicaciones, horarios, edición del perfil académico, mensajes y pagos pertenecen a sprints siguientes. Las tarjetas de ‘próximamente’ indican ese estado. El perfil específico de tutor es una ampliación local solicitada después de los primeros dos sprints. Registré la discrepancia entre la numeración del backlog y la ERS adjunta; no la corregí silenciosamente. La evaluación de desempeño ISO/IEC 25010:2023 y HTTPS del piloto siguen siendo trabajo futuro.”
