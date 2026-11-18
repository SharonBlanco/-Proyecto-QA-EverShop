# Proyecto de pruebas automatizadas de EverShop

Repositorio del proyecto **Aseguramiento de la Calidad del Software** (Grupo 50, Instituto Tecnológico de Costa Rica, Sede San Carlos, II semestre 2026).

Contiene pruebas E2E para EverShop escritas con [Playwright](https://playwright.dev) y reportes integrados con QAtlas. Los casos están organizados por módulo y corresponden al proyecto `ES` de QAtlas.

## Alcance

| Módulo | Requerimientos | Responsable | Pruebas `.test.ts` |
|---|---|---|---:|
| Autenticación y cuentas | REQ-AUTH-001 a REQ-AUTH-004 | Britany Alexandra Romero Hernández | 18 |
| Catálogo de productos | REQ-CAT-001 a REQ-CAT-003 | Sharon Dayana Blanco Piedra | 18 |
| Compras y pedidos | REQ-ORD-001 a REQ-ORD-004 | Jose Armando Cordero Miranda | 18 |
| **Total** | **11 requerimientos** | | **54** |

Las pruebas cubren registro e inicio de sesión, cierre de sesión, idiomas, productos, búsqueda y filtros, carrito, checkout e historial de pedidos. También incluyen verificaciones de rendimiento, integración con API/base de datos y validaciones funcionales.

> Los criterios esperados corresponden a los requerimientos del proyecto, no a comportamientos que EverShop implemente pero que no estén definidos en ellos.

## Archivos del proyecto

```text
├── README.md
├── package.json
├── playwright.config.ts
├── qatlas-reporter.cjs
├── casos_de_prueba.csv
├── requisitos.csv
├── planes_de_prueba.csv
├── suites_de_prueba.csv
├── PlanDeCasos.pdf
├── ProyectoPlanificacion.pdf
└── testsProyecto/
    ├── setup/
    │   └── auth.setup.ts
    ├── auth/
    ├── catalog/
    └── orders/
```

Cada caso usa el formato `tc-<modulo>-<numero>-<descripcion>.test.ts`. Por ejemplo:

- `tc-auth-12-admin-login-success.test.ts`
- `tc-cat-03-set-default-language.test.ts`
- `tc-ord-22-add-to-cart-valid-quantity.test.ts`

Los archivos CSV exportan el inventario de requisitos, casos, suites y el plan de pruebas registrado en QAtlas. Los PDFs contienen la documentación de planificación y casos del proyecto.

## Requisitos previos

- EverShop 2.2.1 instalado y ejecutándose.
- Node.js 20.12 o superior.
- PostgreSQL configurado con la base de datos de EverShop.
- Un usuario cliente y un usuario administrador creados.
- Chromium para Playwright.
- Un token de API de QAtlas con permisos de Tester o Test Manager, solo si se subirán resultados.

## Instalación

Ejecutar desde la raíz de EverShop:

```bash
npm install
npx playwright install chromium
```

## Configuración

Crear o actualizar el archivo `.env` en la raíz de EverShop. Las pruebas reutilizan las variables de EverShop para PostgreSQL y añaden las variables propias del proyecto:

| Variable | Uso |
|---|---|
| `BASE_URL` | URL de EverShop. Por defecto se usa `http://localhost:3000` en las pruebas que incluyen un valor alternativo. |
| `ADMIN_EMAIL` | Correo del administrador de pruebas. |
| `ADMIN_PASSWORD` | Contraseña del administrador de pruebas. |
| `CLIENTE_EMAIL` | Correo del cliente de pruebas. |
| `CLIENTE_PASSWORD` | Contraseña del cliente de pruebas. |
| `DB_HOST` | Host de PostgreSQL. |
| `DB_PORT` | Puerto de PostgreSQL. |
| `DB_USER` | Usuario de PostgreSQL. |
| `DB_PASSWORD` | Contraseña de PostgreSQL. |
| `DB_NAME` | Nombre de la base de datos. |
| `QATLAS_URL` | URL base de la API de QAtlas, terminada en `/api`. |
| `QATLAS_TOKEN` | Token personal de la API de QAtlas. |
| `QATLAS_RUN_NAME` | Nombre opcional de la ejecución creada en QAtlas. |
| `PRODUCTO_URL` | Ruta opcional usada por la prueba de integración de traducciones. |
| `CAMISETA_URL_KEY` | URL key opcional usada por las pruebas de productos con variantes. |

Ejemplo mínimo de formato:

```dotenv
BASE_URL=http://localhost:3000
ADMIN_EMAIL=administrador@example.com
ADMIN_PASSWORD=contraseña
CLIENTE_EMAIL=cliente@example.com
CLIENTE_PASSWORD=contraseña
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=contraseña
DB_NAME=evershop
QATLAS_URL=https://<host>/api
QATLAS_TOKEN=<token>
```

No subir `.env`, contraseñas, tokens ni archivos de sesión (`playwright/.auth/*.json`) al repositorio.

## Preparación de la aplicación

1. Configurar EverShop y PostgreSQL.
2. Crear una cuenta administradora y una cuenta cliente.
3. Iniciar EverShop:

```bash
npm run start
```

4. Mantener EverShop en ejecución y abrir una segunda terminal para Playwright.

Al iniciar una ejecución, Playwright usa el proyecto `setup` para iniciar sesión como administrador y cliente y guardar sus sesiones en `playwright/.auth/`.

## Ejecutar las pruebas

Los reportes están configurados para mostrar los resultados en consola y enviar evidencias y resultados a QAtlas. Para ejecutar localmente sin enviar resultados, reemplazar el reporter:

```bash
npx playwright test --reporter=list
npx playwright test testsProyecto/auth --reporter=list
npx playwright test testsProyecto/catalog --reporter=list
npx playwright test testsProyecto/orders --reporter=list
npx playwright test tc-cat-03 --reporter=list
```

Para ejecutar una funcionalidad concreta:

```bash
npx playwright test testsProyecto/catalog/GestionDeIdiomas --reporter=list
npx playwright test testsProyecto/orders/ProcesoDeCheckout --reporter=list
```

### Ejecutar y reportar en QAtlas

```bash
npx playwright test
QATLAS_RUN_NAME="Ejecución Automatizada Catálogo" npx playwright test testsProyecto/catalog
QATLAS_RUN_NAME="Ejecución Automatizada Compras" npx playwright test testsProyecto/orders
```

Sin `QATLAS_RUN_NAME`, el reporter genera un nombre para la ejecución automáticamente.

### Herramientas adicionales

```bash
npx playwright test --ui
npx playwright show-report
npx playwright codegen --load-storage=playwright/.auth/admin.json http://localhost:3000/admin
npx playwright codegen --load-storage=playwright/.auth/cliente.json http://localhost:3000
```

`codegen` permite inspeccionar o grabar acciones con una sesión ya iniciada.

## Configuración de Playwright

El archivo `playwright.config.ts` define:

- Directorio de pruebas: `testsProyecto/`
- Navegador principal: Chromium
- Ejecución paralela con máximo 3 workers
- Reintentos: 0
- Tiempo límite por prueba: 30 segundos
- Capturas, video y trace solo al fallar
- Proyecto `setup`, que crea las sesiones antes de ejecutar las pruebas
- Proyecto `evershop`, que ejecuta los casos dependientes de las sesiones

Las sesiones se generan en `playwright/.auth/admin.json` y `playwright/.auth/cliente.json`.

## Integración con QAtlas

`qatlas-reporter.cjs` se encarga de:

- Crear una ejecución en QAtlas.
- Relacionar cada prueba con su caso mediante código (`ES-TC-*`) o anotación QAtlas.
- Registrar el estado de cada caso y sus pasos.
- Subir capturas, video y trace.
- Evitar defectos duplicados: busca primero un defecto abierto por la misma causa.
- Vincular ejecuciones nuevas al defecto existente o crear uno nuevo cuando sea necesario.
- Marcar la ejecución como completada al finalizar.

## Convenciones de las pruebas

- El nombre del archivo es `<id>-<descripcion>.test.ts`.
- El título incluye `@ES-TC-X` y el test registra la anotación `qatlas`.
- Los pasos de Playwright siguen el orden y la acción de QAtlas.
- Las precondiciones determinan la sesión usada:
  - administrador: `storageState: 'playwright/.auth/admin.json'`
  - cliente: `storageState: 'playwright/.auth/cliente.json'`
  - sin sesión: no se configura `storageState`.
- Las pruebas intentan restaurar datos, archivos y configuraciones modificadas.
- Las rutas relativas usan `BASE_URL`; por ejemplo, `/admin/products`.
- Las verificaciones deben fallar si EverShop no cumple el requisito del caso.

## Datos y limpieza

Las pruebas mantienen datos de referencia en varios niveles:

- El setup inicia las sesiones administrativas y de cliente.
- Las pruebas de catálogo pueden crear y eliminar productos.
- Las pruebas de idiomas pueden modificar traducciones y restaurar la configuración.
- Las pruebas de pedidos ayudan a crear productos o pedidos necesarios y usan la sesión del cliente.
- Algunas verificaciones consultan directamente PostgreSQL o la API de EverShop.

Antes de ejecutar pruebas destructivas o de integración, comprobar que `DB_*` apunta a la base de datos preparada para la prueba.

## Notas conocidas

- Las pruebas de integración que modifican traducciones pueden detener EverShop y reiniciarlo con `npm run start`. EverShop debe haberse iniciado desde la terminal que ejecuta las pruebas.
- Si la sesión falla inmediatamente después de iniciar EverShop, esperar a que el servidor termine de cargar y volver a ejecutar la prueba.
- EverShop no siempre usa las mismas denominaciones que los requerimientos: por ejemplo, el checkout puede usar `Address`, `Address 2` y `City` en lugar de cantón, distrito y dirección exacta.
- Los rangos de respuesta, los selectores y los mensajes deben validarse en el entorno local si difieren de la primera ejecución registrada.
