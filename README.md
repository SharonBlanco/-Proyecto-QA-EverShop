# Pruebas automatizadas de EverShop

Pruebas de extremo a extremo (E2E, que recorren la aplicación como lo haría un usuario real) de la plataforma de comercio electrónico [EverShop](https://github.com/evershopcommerce/evershop), escritas con [Playwright](https://playwright.dev) e integradas con QAtlas, la herramienta de gestión de pruebas del curso.

Forman parte del proyecto del curso Aseguramiento de la Calidad del Software (Grupo 50, Instituto Tecnológico de Costa Rica, Sede San Carlos, II Semestre 2026).
Cabe recalcar que estas pruebas no son realizadas en base al diseño de la aplicación, los requerimientos fueron definidos por nuestro equipo y la revisión y aplicación de tests fueron basados en nuestros requerimientos, por indicaciones del enunciado del proyecto.

## Equipo y módulos

| Módulo | Requisitos | Responsable |
|---|---|---|
| Autenticación y cuentas | REQ-AUTH-001 a REQ-AUTH-004 | Britany Alexandra Romero Hernández |
| Catálogo de productos | REQ-CAT-001 a REQ-CAT-003 | Sharon Dayana Blanco Piedra |
| Compras y pedidos | REQ-ORD-001 a REQ-ORD-004 | Jose Armando Cordero Miranda |

Cada archivo de prueba automatiza un caso registrado en QAtlas (proyecto `ES`). Los casos, sus pasos, datos de prueba y resultados de cada ejecución se consultan en QAtlas.

## Estructura

```
evershop/
├── playwright.config.ts        Configuración de Playwright y del reporter de QAtlas
├── qatlas-reporter.cjs         Reporter que envía los resultados a QAtlas
├── .env                        Credenciales y configuración local (no se sube al repositorio)
└── testsProyecto/
    ├── setup/
    │   └── auth.setup.ts       Inicia sesión como administrador y como cliente y guarda las sesiones
    └── <módulo>/
        └── <requisito o funcionalidad>/
            └── <id-del-caso>-<descripcion>.test.ts
```

Cada integrante trabaja en la carpeta de su módulo y agrupa los casos en subcarpetas por requisito o funcionalidad. Por ejemplo: `testsProyecto/catalog/GestionDeIdiomas/tc-cat-01-list-available-languages.test.ts`.

Las pruebas viven dentro del proyecto de EverShop porque algunas necesitan sus archivos o su servidor (por ejemplo, las que modifican traducciones y reinician la aplicación).

## Requisitos

- EverShop instalado y funcionando (por defecto en `http://localhost:3000`).
- PostgreSQL en ejecución, con la base de datos de EverShop.
- Node.js 20.12 o superior.
- Una cuenta de administrador y una de cliente creadas en EverShop.
- Un token de API de QAtlas con rol Tester o Test Manager en el proyecto `ES` (solo para subir resultados).

## Instalación

Desde la carpeta de EverShop:

```bash
npm install
npx playwright install chromium
```

## Configuración

Las credenciales se leen del archivo `.env` de la raíz de EverShop, el mismo que usa la aplicación. Además de las variables propias de EverShop (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), las pruebas usan:

| Variable | Para qué sirve |
|---|---|
| `BASE_URL` | Dirección de la tienda (por defecto `http://localhost:3000`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Cuenta de administrador de prueba |
| `CLIENTE_EMAIL`, `CLIENTE_PASSWORD` | Cuenta de cliente de prueba |
| `QATLAS_URL` | Dirección de la API de QAtlas, terminada en `/api` |
| `QATLAS_TOKEN` | Token personal de la API de QAtlas |

Cada integrante usa su propio `.env`. Contiene contraseñas y el token, así que nunca debe subirse al repositorio. Si una prueba necesita una variable adicional, se documenta en su propio archivo y en esta tabla.

## Cómo ejecutar las pruebas

EverShop debe estar corriendo (`npm run start`) antes de ejecutar las pruebas. Cada corrida inicia sesión primero (proyecto `setup`) y después ejecuta los tests.

Probar sin subir resultados a QAtlas:

```bash
npx playwright test --reporter=list                        # todas
npx playwright test <carpeta> --reporter=list              # un módulo o una funcionalidad
npx playwright test <id-del-caso> --reporter=list          # un caso, por ejemplo tc-cat-03
```

Ejecutar y subir los resultados a QAtlas, con un nombre equivalente al de la ejecución manual:

```bash
QATLAS_RUN_NAME="Ejecución Automatizada <nombre>" npx playwright test <carpeta>
```

Cada comando se escribe en una sola línea. Sin `--reporter=list`, los resultados se suben a QAtlas.

Otras herramientas útiles:

```bash
npx playwright test --ui                 # modo visual para depurar
npx playwright show-report               # reporte HTML con capturas, video y trace
npx playwright codegen --load-storage=playwright/.auth/admin.json http://localhost:3000/admin
npx playwright codegen --load-storage=playwright/.auth/cliente.json http://localhost:3000
```

`codegen` abre un navegador con la sesión ya iniciada y genera el código de lo que se hace en pantalla.

## Integración con QAtlas

El archivo `qatlas-reporter.cjs` es una copia modificada del reporter oficial de QAtlas. Al terminar cada corrida:

1. Crea una ejecución en QAtlas y registra el resultado de cada caso, paso por paso cuando el test usa `test.step`.
2. Sube la evidencia (captura, video y trace) indicando el paso al que pertenece, para que se muestre en la ejecución.
3. Cuando un test falla, busca si el caso ya tiene un defecto abierto. Si existe, vincula la ejecución a ese defecto y le agrega la captura, en lugar de crear un duplicado. Si no existe, crea uno nuevo con los pasos, el resultado esperado y el resultado obtenido.
4. Marca la ejecución como completada.

Las modificaciones respecto al reporter oficial son los puntos 2 (evidencia con número de paso), 3 (defectos sin duplicar) y 4 (cierre automático de la ejecución).

Cuando dos casos fallan por la misma causa, cada uno puede quedar con su propio defecto. En ese caso, en QAtlas se marca uno como duplicado del otro y se anota la causa común.

## Convenciones

Para que todas las pruebas se integren igual con QAtlas:

- Nombre de archivo: `<id-del-caso>-<descripcion>.test.ts`, igual al ID de automatización del caso en QAtlas.
- Título del test: `@ES-TC-X Título del caso`, más la anotación `test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-X' })`.
- Un `test.step` por cada paso del caso, en el mismo orden y con el texto de la acción. Al final de cada paso se verifica su resultado esperado.
- Los datos de prueba son los definidos en QAtlas, incluidos los de la columna "Datos de prueba".
- La sesión depende de la precondición del caso: `test.use({ storageState: 'playwright/.auth/admin.json' })` si dice administrador, `cliente.json` si dice cliente, y ninguna si el caso empieza sin sesión.
- Los resultados esperados salen de los requisitos y de los casos, no del comportamiento actual de EverShop. Si la aplicación no cumple el requisito, el test debe fallar.
- Cada test deja el sistema como lo encontró: si crea datos los borra, y si cambia una configuración la restaura (con `afterEach` o `afterAll`).
- Los datos que la precondición exige y que no se están probando (por ejemplo, productos de referencia) pueden crearse por la API en un `beforeAll` y borrarse en un `afterAll`.
- Las rutas se escriben cortas (`/admin/products`), sin la dirección completa, para que usen `BASE_URL`.

## Notas

- Algunas pruebas de integración reinician EverShop (detienen el proceso del puerto 3000 y lo vuelven a iniciar con `npm run start`). Para que puedan hacerlo, EverShop debe iniciarse desde la terminal de VS Code.
- Si el inicio de sesión falla de forma intermitente justo después de prender EverShop, normalmente es porque el servidor todavía está cargando; basta con volver a ejecutar.
- Las pruebas funcionales son de caja negra (los resultados esperados salen de los requisitos). Las de integración son de caja gris, porque además consultan la base de datos, la API o los archivos de la aplicación.
