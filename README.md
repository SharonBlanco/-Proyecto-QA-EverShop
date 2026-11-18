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

En QAtlas hay 60 casos registrados (ES-TC-1 a ES-TC-60): 54 automatizados en este repositorio y 6 que se ejecutan de forma manual (ES-TC-4, ES-TC-9, ES-TC-29, ES-TC-44, ES-TC-45 y ES-TC-46).

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
├── ejecuciones.csv
├── incidencias.csv
├── PlanDeCasos.pdf
├── ProyectoPlanificacion.pdf
└── testsProyecto/
    ├── README.md                         Guía detallada de los tres módulos
    ├── setup/
    │   └── auth.setup.ts                 Inicia sesión como administrador y cliente
    ├── auth/
    │   ├── RegistroDeUsuarios/
    │   ├── InicioSesionCliente/
    │   ├── InicioSesionAdministrador/
    │   └── CierreSesion/
    ├── catalog/
    │   ├── GestionDeIdiomas/
    │   ├── GestionDeProductos/
    │   └── BusquedaYFiltradoDeProductos/
    └── orders/
        ├── README.md                     Guía del módulo de compras y pedidos
        ├── helpers/
        │   └── pedidos.ts                Prepara productos y pedidos de referencia
        ├── AgregarAlCarrito/
        ├── GestionDelCarrito/
        ├── ProcesoDeCheckout/
        └── HistorialDePedidos/
```

Cada caso usa el formato `tc-<modulo>-<numero>-<descripcion>.test.ts`. Por ejemplo:

- `tc-auth-12-admin-login-success.test.ts`
- `tc-cat-03-set-default-language.test.ts`
- `tc-ord-22-add-to-cart-valid-quantity.test.ts`

Los archivos CSV son exportaciones de QAtlas: requisitos, casos, suites, planes de prueba, ejecuciones e incidencias (defectos) registrados. Los PDFs contienen la documentación de planificación y casos del proyecto.

## Casos automatizados

El detalle de cada caso y los hallazgos de los tres módulos están en [testsProyecto/README.md](testsProyecto/README.md).

Cada carpeta corresponde a una suite de QAtlas. La columna *Sesión* indica el `storageState` que usa la prueba; *propia* significa que el test inicia o cierra sesión por su cuenta.

### Autenticación y cuentas

| Suite | Requerimiento | Casos | Archivos | Sesión |
|---|---|---|---|---|
| Registro de usuarios (`RegistroDeUsuarios/`) | REQ-AUTH-001 | ES-TC-21, 39, 41, 43 | `tc-auth-01` a `tc-auth-04` | Sin sesión |
| Inicio de sesión del cliente (`InicioSesionCliente/`) | REQ-AUTH-002 | ES-TC-47 a 51 | `tc-auth-07` a `tc-auth-11` | Propia |
| Inicio de sesión del administrador (`InicioSesionAdministrador/`) | REQ-AUTH-003 | ES-TC-52 a 56 | `tc-auth-12` a `tc-auth-16` | Propia |
| Cierre de sesión (`CierreSesion/`) | REQ-AUTH-004 | ES-TC-57 a 60 | `tc-auth-17` a `tc-auth-20` | Propia |

Manuales: ES-TC-45 y ES-TC-46.

### Catálogo de productos

| Suite | Requerimiento | Casos | Archivos | Sesión |
|---|---|---|---|---|
| Gestión de idiomas (`GestionDeIdiomas/`) | REQ-CAT-001 | ES-TC-1, 2, 3, 5, 19 | `tc-cat-01`, `02`, `03`, `05`, `19` | Administrador / cliente |
| Gestión de productos (`GestionDeProductos/`) | REQ-CAT-002 | ES-TC-6, 7, 8, 11, 12, 20 | `tc-cat-06`, `07`, `08`, `11`, `12`, `20` | Administrador |
| Búsqueda y filtrado (`BusquedaYFiltradoDeProductos/`) | REQ-CAT-003 | ES-TC-10, 13 a 18 | `tc-cat-10`, `tc-cat-13` a `tc-cat-18` | Cliente |

Manuales: ES-TC-4 y ES-TC-9.

### Compras y pedidos

| Suite | Requerimiento | Casos | Archivos | Sesión |
|---|---|---|---|---|
| Agregar al carrito (`AgregarAlCarrito/`) | REQ-ORD-001 | ES-TC-22 a 28 | `tc-ord-22` a `tc-ord-28` | Cliente |
| Gestión del carrito (`GestionDelCarrito/`) | REQ-ORD-002 | ES-TC-30 a 33 | `tc-ord-30` a `tc-ord-33` | Cliente |
| Proceso de checkout (`ProcesoDeCheckout/`) | REQ-ORD-003 | ES-TC-34 a 37 | `tc-ord-34` a `tc-ord-37` | Cliente |
| Historial de pedidos (`HistorialDePedidos/`) | REQ-ORD-004 | ES-TC-38, 40, 42 | `tc-ord-38`, `40`, `42` | Cliente / propia |

Manuales: ES-TC-29 y ES-TC-44. Los datos de referencia y los comandos por suite están en [testsProyecto/orders/README.md](testsProyecto/orders/README.md).

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

El reporter también acepta variables opcionales como `QATLAS_PROJECT`, `QATLAS_RUN_ID`, `QATLAS_CREATE_BUG_ON_FAILURE`, `QATLAS_DEDUPE_BUGS`, `QATLAS_BUG_SEVERITY` y `QATLAS_BUG_PRIORITY`. En este proyecto, el código `ES` y la creación de defectos ya vienen definidos en `playwright.config.ts`.

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
npx playwright test testsProyecto/auth/CierreSesion --reporter=list
```

### Ejecutar y reportar en QAtlas

```bash
npx playwright test
QATLAS_RUN_NAME="Ejecución Automatizada Autenticación" npx playwright test testsProyecto/auth
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
- Navegador: Chromium con el perfil `Desktop Chrome`
- Ejecución totalmente paralela con 3 workers
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
