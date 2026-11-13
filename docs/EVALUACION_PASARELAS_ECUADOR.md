# Evaluación de pasarelas para tutores en Ecuador

HT-11, sprint 1, 5 puntos. Consulta documental: 28 de octubre de 2026. Resultado: hay alternativas técnicas candidatas; la elegibilidad comercial y el flujo de liquidación de este proyecto aún no están aprobados. No se contactó a proveedores, se registraron cuentas ni se ejecutaron cobros o sandbox autenticado.

La primera versión no cobra comisión propia. Las comisiones del procesador siguen existiendo. La plataforma no debe retener fondos ni prometer custodia o devoluciones automáticas que el proveedor no respalde. Los requisitos de negocio proceden del backlog y no representan un cambio aprobado de la ERS.

## Matriz de alternativas

| Alternativa | Cuenta y acceso | Costos del proveedor | Destinatarios y liquidación | Confirmación y pruebas | Resultado |
| --- | --- | --- | --- | --- | --- |
| Payphone | Integración Business con tienda; split exige autorización comercial, datos legales y análisis del negocio | La página oficial publica 5 % + IVA por cobro con tarjeta; confirmar tarifa contractual vigente y cualquier costo de retiro [1] | Split permite repartir entre cuentas Payphone autorizadas, identificadas por teléfono o identificación comercial; modalidad inmediata o al día siguiente. No equivale a un abono bancario inmediato; plazos de retiro no verificados [2] | Cajita requiere confirmar desde backend; omitirlo durante cinco minutos provoca reverso automático. El portal anuncia sandbox; no se ejecutó con credenciales [3] | Candidato documental prioritario; autorización para tutores y elegibilidad pendiente |
| Kushki | Comercio afiliado, credenciales y habilitación comercial; las capacidades dependen del modelo aprobado | No se verificó una tarifa pública aplicable al proyecto en Ecuador. La página de precios consultada muestra Chile; no se extrapolan sus condiciones [4] | Las comisiones a terceros se ofrecen en Ecuador con reglas predefinidas; ese producto no demuestra en sí liquidación dinámica a cada tutor. Jerarquías organiza subcomercios; falta confirmar titularidad y pagos a estudiantes [5][6] | Existen Smartlinks y documentación de webhooks para Ecuador. Debe verificarse autenticidad del evento y el estado en servidor; disponibilidad sandbox específica pendiente [7] | Alternativa a consultar comercialmente |
| Nuvei Ecuador / Paymentez | El sitio oficial local ofrece pasarela y soporte para desarrolladores; el enlace SDK indexado redirigió a la portada y no permitió verificar el manual local. Afiliación específica pendiente [8] | Comisión, mínimos y calendario de abonos no verificados; solicitar cotización oficial específica | La documentación global de Platforms describe vendedores/KYC y payouts, pero no prueba que el mismo producto esté habilitado para estos tutores en Ecuador [9] | La guía global Payment Page exige confirmación servidor a servidor mediante DMN/webhook, no confiar en la redirección del navegador. Se debe comprobar el producto local contratado [10] | Tercera alternativa; compatibilidad local del modelo pendiente |

## Hallazgos que condicionan la decisión

Payphone documenta que todos los receptores del split deben pertenecer a su red y que el permiso se concede por tienda. Sus reglas de reverso dependen del momento de dispersión; el split inmediato puede requerir recuperación manual de los receptores o saldo del comercio para el reverso. Esto impide prometer una garantía automática al estudiante. La documentación de split menciona 5,75 % en sus ejemplos, mientras el portal general expresa 5 % más IVA: se deben confirmar tarifa e impuestos contractuales sin deducir una tasa fiscal universal. [1][2]

Su notificación externa comunica pagos aprobados mediante POST, requiere HTTPS y autorización previa. Debe aclararse con el proveedor el mecanismo de autenticación del webhook y cubrir estados que no notifica. La confirmación de Cajita y la notificación externa son mecanismos distintos y no se deben confundir. [3][11]

Kushki informa que, una vez habilitadas las comisiones a terceros, se aplican reglas a todas las transacciones del comercio. Ese mecanismo no acredita por sí mismo que se pueda escoger un tutor receptor diferente por operación. No se asigna comisión a la plataforma para adaptar artificialmente ese producto al proyecto. [5]

## Diseño técnico futuro propuesto por el proyecto

Cada tutor deberá vincular un identificador validado por el proveedor. Los importes se calcularán en centavos y USD en backend; el navegador no decidirá destinatario o total. Se registrará una referencia de propuesta y un identificador externo único. Un webhook/reconsulta auténtico deberá verificar comercio, tutor, monto, moneda y estado antes de confirmar. Una clave de idempotencia impedirá duplicar eventos. Se guardarán los eventos mínimos sin datos de tarjeta.

Se propone probar en sandbox: aprobado, pendiente, rechazado, expirado, evento repetido, firma inválida, monto/moneda distintos y devolución. Es un plan de validación de HT-12, no una integración ni una prueba ejecutada en este sprint.

## Decisión y pendientes de aceptación

Mantener HT-11 **parcial** hasta tener confirmación del proveedor de que admite tutores estudiantes como receptores, cuenta comercial apta, costos totales, liquidación directa sin retención de la plataforma y cancelación/devolución viable. Solicitar después una prueba sandbox de punta a punta. Si ninguna opción satisface el modelo, registrar el impedimento y llevar la decisión al docente antes de cambiar el alcance. No se necesita contratar o contactar a terceros para demostrar registro y login de los sprints actuales.

## Fuentes oficiales consultadas

1. [Payphone Developers y tarifa publicada](https://docs.payphone.app/).
2. [Payphone Split de Pagos, autorización, receptores y reversos](https://docs.payphone.app/split-de-pagos).
3. [Payphone Cajita de Pagos y confirmación](https://docs.payphone.app/cajita-de-pagos).
4. [Kushki precios, página consultada correspondiente a Chile](https://www.kushkipagos.com/commissions-fee).
5. [Kushki Ecuador Comisiones a terceros](https://docs.kushki.com/ec/card-payments/split-payments/).
6. [Kushki Jerarquías y subcomercios](https://www.kushkipagos.com/blog-kushki-hub/conoce-sobre-nuestra-funcionalidad-jerarquias-kushki).
7. [Kushki Ecuador Webhooks Smartlinks](https://docs.kushki.com/ec/notifications/smartlinks/smartlinks/).
8. [Nuvei Ecuador, sitio oficial; el enlace SDK indexado redirige aquí](https://www.nuvei.com.ec/).
9. [Nuvei Platforms notificaciones de vendedores, transacciones y payouts](https://docs.platforms.nuvei.com/docs/webhooks/introduction/).
10. [Nuvei Payment Page confirmación mediante DMN](https://docs.nuvei.com/documentation/accept-payment/payment-page/quick-start-for-payment-page/).
11. [Payphone Notificación Externa](https://docs.payphone.app/notificacion-externa).
