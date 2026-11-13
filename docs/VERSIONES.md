# Versiones del entorno y reproducibilidad

Equipo verificado el 28 de octubre de 2026: Windows 11 Home, 64 bits, versión 10.0.26300.

| Herramienta | Versión |
| --- | --- |
| Node.js | 22.16.0 |
| npm | 11.4.1 |
| Git | 2.49.0.windows.1 |
| PostgreSQL | 17.6 |
| React / React DOM | 19.3.1 |
| Vite | 6.4.5 |
| Tailwind CSS | 3.4.19 |
| React Router DOM | 7.18.5 |
| Express | 5.3.0 |
| pg | 8.23.1 |
| express-session | 1.19.0 |
| connect-pg-simple | 10.0.0 |
| Argon2 | 0.44.0 |
| Zod | 4.6.7 |
| Helmet | 8.3.0 |
| express-rate-limit | 8.7.1 |
| Playwright | 1.64.1 |
| Firefox instalado, verificado con WebDriver BiDi | 155.0.1 |
| Prettier | 3.9.10 |
| Puppeteer Core | 25.16.0 |

`package-lock.json` es la referencia completa de versiones exactas e integridad. `docs/evidencias/dependencias.txt` registra npm ls sin secretos. Se ejecutó `npm ci` en una carpeta vacía de paquetes bajo `.local/clean-install`, con los manifiestos y lockfile del proyecto: 358 paquetes instalados correctamente, sin modificar node_modules del servidor en ejecución.

Los archivos originales de Stitch dependían del CDN de Tailwind y Google Fonts. La adaptación compila Tailwind localmente y sirve las fuentes desde paquetes npm. La imagen académica original se conserva como recurso local en `frontend/public/images/stitch-academia.jpg`; no requiere descargas al navegar.
