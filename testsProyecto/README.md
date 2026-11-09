# Pruebas automatizadas de EverShop: módulo de catálogo

Pruebas de extremo a extremo (E2E, que recorren la aplicación como lo haría un usuario real) del módulo de catálogo de productos de [EverShop](https://github.com/evershopcommerce/evershop), escritas con [Playwright](https://playwright.dev) e integradas con QAtlas, la herramienta de gestión de pruebas del curso.

Forman parte del proyecto del curso Aseguramiento de la Calidad del Software (Grupo 50, Instituto Tecnológico de Costa Rica, Sede San Carlos, II Semestre 2026), a cargo del profesor Marcos Antonio Rodríguez Ovares.

Equipo: Sharon Dayana Blanco Piedra (catálogo de productos), Britany Alexandra Romero Hernández (autenticación y cuentas) y Jose Armando Cordero Miranda (compras y pedidos).

## Qué se prueba

Cada archivo automatiza un caso de prueba registrado en QAtlas (proyecto `ES`). El código del caso aparece en el título del test, y cada `test.step` corresponde a un paso del caso, en el mismo orden.

### ES-1 Gestión de idiomas de la tienda (REQ-CAT-001)

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-1 Visualizar lista de idiomas disponibles | `tc-cat-01-list-available-languages.test.ts` | Administrador |
| ES-TC-2 Cambiar idioma de la tienda desde la interfaz | `tc-cat-02-change-store-language.test.ts` | Cliente |
| ES-TC-3 Establecer idioma predeterminado de la tienda | `tc-cat-03-set-default-language.test.ts` | Administrador |
| ES-TC-5 Tiempo de respuesta al cambiar el idioma | `tc-cat-05-language-change-response-time.test.ts` | Cliente |
| ES-TC-19 Integración entre el diccionario de traducciones y la interfaz | `tc-cat-19-interface-translation-integration.test.ts` | Cliente |

ES-TC-4 se ejecuta de forma manual.

### ES-2 Creación, eliminación y edición de un producto (REQ-CAT-002)

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-6 Crear producto con datos válidos | `tc-cat-06-create-product-valid-data.test.ts` | Administrador |
| ES-TC-7 Crear producto sin nombre | `tc-cat-07-create-product-empty-name.test.ts` | Administrador |
| ES-TC-8 Integración entre la creación de producto, la base de datos y la API | `tc-cat-08-product-database-api-integration.test.ts` | Administrador |
| ES-TC-11 Editar precio de un producto existente | `tc-cat-11-edit-product-price.test.ts` | Administrador |
| ES-TC-12 Eliminar un producto | `tc-cat-12-delete-product.test.ts` | Administrador |
| ES-TC-20 Crear producto con precio no numérico | `tc-cat-20-create-product-non-numeric-price.test.ts` | Administrador |

ES-TC-9 se ejecuta de forma manual.

### ES-3 Búsqueda y filtrado de productos (REQ-CAT-003)

En desarrollo: ES-TC-10, ES-TC-13 a ES-TC-18.

## Estructura

```
evershop/
├── playwright.config.ts        Configuración de Playwright y del reporter de QAtlas
├── qatlas-reporter.cjs         Reporter que envía los resultados a QAtlas
├── .env                        Credenciales y configuración local (no se sube al repositorio)
└── testsProyecto/
    ├── setup/
    │   └── auth.setup.ts       Inicia sesión como administrador y como cliente y guarda las sesiones
    └── catalog/
        ├── GestionDeIdiomas/
        ├── GestionDeProductos/
        └── BusquedaYFiltradoDeProductos/
```

Las pruebas viven dentro del proyecto de EverShop porque algunas necesitan sus archivos: ES-TC-19 escribe en `translations/es/` y reinicia el servidor.

## Requisitos

- EverShop 2.2.1 instalado y funcionando en `http://localhost:3000`.
- PostgreSQL en ejecución, con la base de datos de EverShop.
- Node.js 20.12 o superior (se usó la v20.20.2).
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
| `PRODUCTO_URL` | Opcional. Producto usado en ES-TC-19 (por defecto `/hogar/tazaceramicaazul`) |

El `.env` contiene contraseñas y el token, así que nunca debe subirse al repositorio.

## Cómo ejecutar las pruebas

EverShop debe estar corriendo (`npm run start`) antes de ejecutar las pruebas. Cada corrida inicia sesión primero (proyecto `setup`) y después ejecuta los tests.

Probar sin subir resultados a QAtlas:

```bash
npx playwright test --reporter=list                           # todas
npx playwright test GestionDeIdiomas --reporter=list          # una carpeta
npx playwright test tc-cat-03 --reporter=list                 # un caso
```

Ejecutar y subir los resultados a QAtlas, con un nombre de ejecución equivalente al de la ejecución manual:

```bash
QATLAS_RUN_NAME="Ejecución Automatizada Gestión Idiomas" npx playwright test GestionDeIdiomas
QATLAS_RUN_NAME="Ejecución Automatizada Gestión Productos" npx playwright test GestionDeProductos
```

Otras herramientas útiles:

```bash
npx playwright test --ui                 # modo visual para depurar
npx playwright show-report               # reporte HTML con capturas, video y trace
npx playwright codegen --load-storage=playwright/.auth/admin.json http://localhost:3000/admin
```

## Integración con QAtlas

El archivo `qatlas-reporter.cjs` es una copia modificada del reporter oficial de QAtlas. Al terminar cada corrida:

1. Crea una ejecución en QAtlas y registra el resultado de cada caso, paso por paso cuando el test usa `test.step`.
2. Sube la evidencia (captura, video y trace) indicando el paso al que pertenece, para que se muestre en la ejecución.
3. Cuando un test falla, busca si el caso ya tiene un defecto abierto. Si existe, vincula la ejecución a ese defecto y le agrega la captura, en lugar de crear un duplicado. Si no existe, crea uno nuevo con los pasos, el resultado esperado y el resultado obtenido.
4. Marca la ejecución como completada.

Las modificaciones respecto al reporter oficial son los puntos 2 (evidencia con número de paso), 3 (defectos sin duplicar) y 4 (cierre automático de la ejecución).

## Convenciones

- Nombre de archivo: `tc-cat-XX-descripcion.test.ts`, igual al ID de automatización del caso en QAtlas.
- Título del test: `@ES-TC-X Título del caso`, más la anotación `{ type: 'qatlas', description: 'ES-TC-X' }`.
- Un `test.step` por cada paso del caso, con el mismo texto de la acción. Al final de cada paso se verifica su resultado esperado.
- Los datos de prueba son los definidos en QAtlas, incluidos los de la columna "Datos de prueba".
- La sesión depende de la precondición del caso: `admin.json` si dice administrador y `cliente.json` si dice cliente.
- Cada test deja el sistema como lo encontró: restaura el idioma predeterminado, devuelve el precio original o borra los productos que crea.
- Los datos que EverShop exige pero que no forman parte del caso (SKU, URL key, Meta Title, peso y clase de impuesto) se llenan con valores fijos que no chocan con los productos existentes.

## Hallazgos principales

| Caso | Hallazgo |
|---|---|
| ES-TC-1 | La lista de idiomas muestra 184 opciones en lugar de solo los configurados (Español e English). |
| ES-TC-2, ES-TC-5 | La tienda no ofrece un control para que el cliente cambie el idioma. |
| ES-TC-6 | El formulario de producto no incluye el campo de marca que pide el criterio de aceptación de REQ-CAT-002. |
| ES-TC-12 | Al eliminar un producto no se muestra un mensaje de confirmación. |

## Notas

- ES-TC-19 reinicia EverShop: detiene el proceso que corre en el puerto 3000, lo vuelve a iniciar con `npm run start` y, al terminar, restaura el idioma y borra el archivo de traducción de prueba. EverShop debe iniciarse desde la terminal de VS Code para que el test pueda detenerlo.
- Si el inicio de sesión falla de forma intermitente justo después de prender EverShop, normalmente es porque el servidor todavía está cargando; basta con volver a ejecutar.
