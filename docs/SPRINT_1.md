# Sprint 1 Arquitectura y presentación inicial

Plan original: semanas 1–2, 18 puntos. No se cambia la distribución del backlog.

HT-01 (3 puntos) prepara entorno, dependencias, configuración, secretos y scripts. Se usaron las instalaciones existentes de Node, Git y PostgreSQL; se creó un repositorio Git y un monorepo npm con frontend/backend. `package-lock.json` fija versiones, `.env.example` documenta configuración y `.gitignore` protege datos locales. Evidencias: build, arranque real y versiones; ver PRUEBAS_REALIZADAS.md. Estado: verificado en este equipo; no se afirma validación en otro sistema operativo.

HT-02 (5 puntos), dependiente de HT-01, implementa tres capas. React usa `services/http.js`; Express pasa por rutas, middleware, controladores y servicios antes de llamar repositorios. `ARQUITECTURA.md` documenta componentes y contrato. La prueba de salud consulta PostgreSQL realmente. Estado: verificado.

HT-05 (5 puntos), dependiente de HT-02, adapta la portada y el interior de Stitch. Se desarrollaron pantallas de registro, login, cuenta y estados de los módulos futuros con la misma paleta, fuentes y recurso académico. Componentes compartidos: marca, botones, campos, contraseñas, avisos, modal, cabeceras y pie. La API se consume mediante un cliente único, con errores de red y validación. La navegación privada valida sesión en servidor. Pruebas E2E verifican desktop y móvil; resultados por motor en el informe. Estado: verificado en Chromium y Firefox, incluyendo vista móvil, sin atribuir búsqueda o mensajería funcional.

HT-11 (5 puntos), dependiente de HT-01, compara Payphone, Kushki y Nuvei en Ecuador. `EVALUACION_PASARELAS_ECUADOR.md` distingue datos oficiales consultados, limitaciones y cuestiones comerciales no verificadas. No se introdujeron credenciales ni se hicieron cobros; tampoco se contactó a proveedores. Estado: parcial respecto de una prueba sandbox y aprobación del modelo comercial. La investigación documental está entregada.

La matriz completa relaciona dependencias, archivos y criterios en MATRIZ_TRAZABILIDAD.md. Las diferencias académicas se registran en OBSERVACIONES.md.
