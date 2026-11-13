# Uso del espacio de estudiante y tutor

La cuenta se crea como estudiante. Ofrecer tutorías es una ampliación de esa misma cuenta; no requiere otro correo o contraseña ni concede permisos de administrador.

## Presentarte como tutor

Desde la navegación o el menú de tu nombre, entra en **Conviértete en tutor**. El recorrido tiene cuatro partes: revisar universidad/carrera/semestre, escoger materias, indicar tu dominio del 1 al 5 y preparar tu presentación. Al final revisas y confirmas los datos.

El dominio es una declaración personal. El cuestionario no califica, verifica títulos ni certifica competencia. Se exige al menos una materia del catálogo, sin duplicados, y niveles válidos. Los datos y el perfil se guardan en una transacción; una materia inválida revierte los cambios. Los perfiles creados antes de este ajuste mantienen su acceso.

Ciudad y dirección aparecen como datos opcionales tanto en el registro de estudiante como en el alta de tutor. Se completan juntas. Se conservan en el mismo registro privado de la cuenta; la dirección sigue cifrada con AES-256-GCM. Puedes corregirlas en **Mi cuenta**, también desde el modo tutor. No se duplican en un panel lateral de tutor.

## Cambiar de modo

Después del alta, la navegación y el menú del perfil permiten alternar **Modo tutor** y **Modo estudiante**. El modo se deriva de la ruta y de la identidad recuperada del servidor; no se guardan identidad, permisos ni contraseñas en localStorage.

En modo estudiante se conservan **Explorar**, **Mis tutorías** y **Mensajes**. En modo tutor se muestran **Panel de tutor**, **Mis publicaciones**, **Mensajes** y **Reservas**. El selector naranja debajo del saludo y la franja de comunidad se retiraron.

## Crear y administrar publicaciones

El botón **Agregar una tutoría** está visible en el panel principal de tutor y en **Mis publicaciones**. La lista tiene sus propios filtros de activas/pausadas y permite editar, activar, desactivar o abrir cada publicación. La creación y edición ocurren en otra pantalla.

El formulario pide asignatura, título, descripción, **precio en dólares por sesión** y modalidad (**Virtual**, **Presencial** o **Virtual y presencial**). El precio es obligatorio para nuevas publicaciones y actualizaciones, admite hasta dos decimales y se guarda como un entero de centavos para evitar pérdida de precisión. El límite técnico es de 0 a 1 000 000 de centavos. No se cobran pagos desde la aplicación.

Los precios de las publicaciones preexistentes no se inventaron: aparecen como **Precio pendiente** hasta que su propietario los complete. Un importe explícito de cero aparece como **Gratuito**. La moneda es USD y la unidad es sesión.

## Explorar y abrir una tutoría

Las tarjetas tienen tonos suaves y muestran materia, modalidad, tutor y precio. **Ver tutoría** abre el detalle con descripción, presentación del tutor y dominio declarado de esa materia cuando existe. El correo y la dirección siguen privados.

**Buscar por nombre** busca una coincidencia parcial en el título de la tutoría, sin distinguir mayúsculas ni tildes. Puedes combinarlo con **Asignatura**: por ejemplo, `limite` + `Cálculo` devuelve únicamente títulos que contienen esa palabra y pertenecen a Cálculo. Sin nombre se muestran todas las tutorías de la asignatura; sin asignatura, las coincidencias de título en todas ellas.

**Eliminar filtros** aparece cuando hay un nombre o asignatura aplicada; devuelve al catálogo completo y a la primera página. No se añadió un filtro por semestre.

## Contadores y límites actuales

El panel de tutor calcula publicaciones, tutorías activas y visitas con datos reales de PostgreSQL. Una visita se cuenta por estudiante y día; las del propietario no se suman. Las publicaciones pausadas no se abren a otras cuentas. El tutor solo recibe totales; la base guarda el identificador del visitante para deduplicar y elimina sus filas al eliminar la cuenta o la publicación.

Mensajes, reservas y registro de ganancias tienen apartados identificados, pero sus flujos todavía no están operativos. El panel no presenta cobros, reservas ni ingresos ficticios. Los acuerdos económicos se realizan fuera de la plataforma.

## Archivos principales

- `frontend/src/pages/TutorOnboarding.jsx`: recorrido de alta.
- `frontend/src/pages/TutorPanel.jsx`: resumen, perfil y estados de funciones pendientes.
- `frontend/src/pages/Publications.jsx`: directorio, detalle, lista propia y editor.
- `frontend/src/components/Layout.jsx`: navegación y menú de modos.
- `frontend/src/workspace.css`: presentación interior adaptable.
- `backend/migrations/006_tutor_workspace.sql` y `007_price_per_session.sql`: cambios de persistencia.

Se conserva React → cliente HTTP → rutas → controladores → servicios → repositorios → PostgreSQL. Las mutaciones exigen sesión y CSRF; la identidad procede de la sesión y las escrituras se limitan al propietario.


## Cuestionario adaptado a la altura

Los cuatro pasos mantienen sus colores y mascota. Los datos iniciales usan columnas; las materias del catálogo se distribuyen por páginas cuando el espacio es reducido. Después de elegir varias, puedes cambiar entre ellas con Materia anterior / Siguiente materia para indicar el dominio de cada una. Continuar exige todos los niveles y muestra la primera materia pendiente. La revisión tiene apartados de datos académicos, presentación y materias; los contenidos extensos se recorren con botones para mantener la pantalla y las acciones visibles.
