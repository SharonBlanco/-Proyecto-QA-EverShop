# Pruebas automatizadas de EverShop

Pruebas de extremo a extremo (E2E, que recorren la aplicación como lo haría un usuario real) de [EverShop](https://github.com/evershopcommerce/evershop), escritas con [Playwright](https://playwright.dev) e integradas con QAtlas, la herramienta de gestión de pruebas del curso.

Forman parte del proyecto del curso Aseguramiento de la Calidad del Software (Grupo 50, Instituto Tecnológico de Costa Rica, Sede San Carlos, II Semestre 2026), a cargo del profesor Marcos Antonio Rodríguez Ovares.

| Módulo | Carpeta | Responsable | Automatizados | Manuales |
|---|---|---|---:|---|
| Autenticación y cuentas | `auth/` | Britany Alexandra Romero Hernández | 18 | ES-TC-45, ES-TC-46 |
| Catálogo de productos | `catalog/` | Sharon Dayana Blanco Piedra | 18 | ES-TC-4, ES-TC-9 |
| Compras y pedidos | `orders/` | Jose Armando Cordero Miranda | 18 | ES-TC-29, ES-TC-44 |

## Qué se prueba

Cada archivo automatiza un caso de prueba registrado en QAtlas (proyecto `ES`). El código del caso aparece en el título del test, y cada `test.step` corresponde a un paso del caso, en el mismo orden. Cada carpeta corresponde a una suite de QAtlas.

En la columna *Sesión*, "Propia" significa que el test inicia o cierra sesión por su cuenta, y "Sin sesión" que arranca con el navegador limpio.

## Autenticación y cuentas (`auth/`)

### ES-8 Registro de usuario (REQ-AUTH-001), `RegistroDeUsuarios/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-21 Registro exitoso con datos válidos | `tc-auth-01-register-success.test.ts` | Sin sesión |
| ES-TC-39 Registro con correo electrónico duplicado | `tc-auth-02-register-duplicate-email.test.ts` | Sin sesión |
| ES-TC-41 Registro con contraseña de menos de 6 caracteres | `tc-auth-03-register-short-password.test.ts` | Sin sesión |
| ES-TC-43 Registro con contraseña de exactamente 6 caracteres | `tc-auth-04-register-six-char-password.test.ts` | Sin sesión |

ES-TC-45 y ES-TC-46 se ejecutan de forma manual.

### ES-9 Inicio de sesión del cliente (REQ-AUTH-002), `InicioSesionCliente/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-47 Inicio de sesión exitoso del cliente | `tc-auth-07-client-login-success.test.ts` | Propia |
| ES-TC-48 Inicio de sesión con contraseña incorrecta | `tc-auth-08-client-wrong-password.test.ts` | Propia |
| ES-TC-49 Inicio de sesión con correo no registrado | `tc-auth-09-client-unknown-email.test.ts` | Propia |
| ES-TC-50 Inicio de sesión con campos vacíos | `tc-auth-10-client-empty-fields.test.ts` | Propia |
| ES-TC-51 Mantener sesión activa durante la navegación | `tc-auth-11-client-session-persistence.test.ts` | Propia |

### ES-10 Inicio de sesión del administrador (REQ-AUTH-003), `InicioSesionAdministrador/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-52 Inicio de sesión exitoso del administrador | `tc-auth-12-admin-login-success.test.ts` | Propia |
| ES-TC-53 Inicio de sesión del administrador con contraseña incorrecta | `tc-auth-13-admin-wrong-password.test.ts` | Propia |
| ES-TC-54 Denegar acceso administrativo a un usuario cliente | `tc-auth-14-client-deny-access.test.ts` | Propia |
| ES-TC-55 Impedir acceso al panel administrativo sin autenticación | `tc-auth-15-admin-panel-access.test.ts` | Propia |
| ES-TC-56 Expiración de sesión administrativa por inactividad | `tc-auth-16-admin-expire-session.test.ts` | Propia |

### ES-11 Cierre de sesión del usuario (REQ-AUTH-004), `CierreSesion/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-57 Cierre de sesión exitoso del cliente | `tc-auth-17-client-logout.test.ts` | Propia |
| ES-TC-58 Cierre de sesión exitoso del administrador | `tc-auth-18-admin-logout.test.ts` | Propia |
| ES-TC-59 Bloquear páginas protegidas después del cierre de sesión | `tc-auth-19-logout-protected-page.test.ts` | Propia |
| ES-TC-60 Verificar botón Atrás después de cerrar sesión | `tc-auth-20-logout-button-back.test.ts` | Propia |

## Catálogo de productos (`catalog/`)

### ES-1 Gestión de idiomas de la tienda (REQ-CAT-001), `GestionDeIdiomas/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-1 Visualizar lista de idiomas disponibles | `tc-cat-01-list-available-languages.test.ts` | Administrador |
| ES-TC-2 Cambiar idioma de la tienda desde la interfaz | `tc-cat-02-change-store-language.test.ts` | Cliente |
| ES-TC-3 Establecer idioma predeterminado de la tienda | `tc-cat-03-set-default-language.test.ts` | Administrador |
| ES-TC-5 Tiempo de respuesta al cambiar el idioma | `tc-cat-05-language-change-response-time.test.ts` | Cliente |
| ES-TC-19 Integración entre el diccionario de traducciones y la interfaz | `tc-cat-19-interface-translation-integration.test.ts` | Cliente |

ES-TC-4 se ejecuta de forma manual.

### ES-2 Creación, eliminación y edición de un producto (REQ-CAT-002), `GestionDeProductos/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-6 Crear producto con datos válidos | `tc-cat-06-create-product-valid-data.test.ts` | Administrador |
| ES-TC-7 Crear producto sin nombre | `tc-cat-07-create-product-empty-name.test.ts` | Administrador |
| ES-TC-8 Integración entre la creación de producto, la base de datos y la API | `tc-cat-08-product-database-api-integration.test.ts` | Administrador |
| ES-TC-11 Editar precio de un producto existente | `tc-cat-11-edit-product-price.test.ts` | Administrador |
| ES-TC-12 Eliminar un producto | `tc-cat-12-delete-product.test.ts` | Administrador |
| ES-TC-20 Crear producto con precio no numérico | `tc-cat-20-create-product-non-numeric-price.test.ts` | Administrador |

ES-TC-9 se ejecuta de forma manual.

### ES-3 Búsqueda y filtrado de productos (REQ-CAT-003), `BusquedaYFiltradoDeProductos/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-10 Tiempo de respuesta de la búsqueda de productos | `tc-cat-10-search-response-time.test.ts` | Cliente |
| ES-TC-13 Buscar producto por nombre existente | `tc-cat-13-search-existing-product.test.ts` | Cliente |
| ES-TC-14 Búsqueda sin resultados | `tc-cat-14-search-no-results.test.ts` | Cliente |
| ES-TC-15 Filtrar productos por categoría | `tc-cat-15-filter-by-category.test.ts` | Cliente |
| ES-TC-16 Filtrar productos por rango de precio | `tc-cat-16-filter-by-price-range.test.ts` | Cliente |
| ES-TC-17 Búsqueda con caracteres especiales | `tc-cat-17-search-special-characters.test.ts` | Cliente |
| ES-TC-18 Tiempo de respuesta al aplicar filtros sobre una búsqueda | `tc-cat-18-filtered-search-response-time.test.ts` | Cliente |

## Compras y pedidos (`orders/`)

Todas las pruebas de este módulo usan `helpers/pedidos.ts`, que prepara los productos de referencia ("Taza Cerámica Azul", "Chorreador de Café" y "Producto Sin Stock") y consulta la base de datos. Los detalles están en [orders/README.md](orders/README.md).

### ES-4 Agregar productos al carrito de compras (REQ-ORD-001), `AgregarAlCarrito/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-22 Agregar producto al carrito con cantidad válida | `tc-ord-22-add-to-cart-valid-quantity.test.ts` | Cliente |
| ES-TC-23 Agregar producto con cantidad mayor al stock disponible | `tc-ord-23-add-to-cart-quantity-above-stock.test.ts` | Cliente |
| ES-TC-24 Agregar producto con cantidad cero | `tc-ord-24-add-to-cart-quantity-zero.test.ts` | Cliente |
| ES-TC-25 Agregar producto con variantes seleccionando una opción | `tc-ord-25-add-to-cart-product-with-variants.test.ts` | Cliente |
| ES-TC-26 Agregar al carrito un producto sin stock | `tc-ord-26-add-to-cart-out-of-stock.test.ts` | Cliente |
| ES-TC-27 Tiempo de respuesta al agregar un producto al carrito | `tc-ord-27-add-to-cart-response-time.test.ts` | Cliente |
| ES-TC-28 Integración entre agregar al carrito, la base de datos y la API | `tc-ord-28-add-to-cart-database-api-integration.test.ts` | Cliente |

### ES-5 Gestión del carrito de compras (REQ-ORD-002), `GestionDelCarrito/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-30 Modificar la cantidad de un producto desde el carrito | `tc-ord-30-modify-cart-quantity.test.ts` | Cliente |
| ES-TC-31 Eliminar un producto individual del carrito | `tc-ord-31-remove-single-cart-item.test.ts` | Cliente |
| ES-TC-32 Mostrar mensaje al eliminar el último producto del carrito | `tc-ord-32-empty-cart-message.test.ts` | Cliente |
| ES-TC-33 Tiempo de respuesta al modificar la cantidad en el carrito | `tc-ord-33-cart-quantity-response-time.test.ts` | Cliente |

ES-TC-29 se ejecuta de forma manual.

### ES-6 Proceso de checkout (REQ-ORD-003), `ProcesoDeCheckout/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-34 Completar el checkout con datos válidos | `tc-ord-34-checkout-valid-data.test.ts` | Cliente |
| ES-TC-35 Checkout con la dirección exacta vacía | `tc-ord-35-checkout-empty-exact-address.test.ts` | Cliente |
| ES-TC-36 Integración entre el carrito y el resumen del checkout | `tc-ord-36-cart-checkout-summary-integration.test.ts` | Cliente |
| ES-TC-37 Tiempo de respuesta al cargar el checkout | `tc-ord-37-checkout-load-time.test.ts` | Cliente |

### ES-7 Historial de pedidos del cliente (REQ-ORD-004), `HistorialDePedidos/`

| Caso | Archivo | Sesión |
|---|---|---|
| ES-TC-38 Visualizar el historial de pedidos del cliente | `tc-ord-38-view-order-history.test.ts` | Cliente |
| ES-TC-40 Ver el detalle de un pedido | `tc-ord-40-view-order-detail.test.ts` | Cliente |
| ES-TC-42 Historial de pedidos sin pedidos realizados | `tc-ord-42-order-history-empty.test.ts` | Propia (registra un cliente nuevo) |

ES-TC-44 se ejecuta de forma manual.

## Estructura

```
evershop/
├── playwright.config.ts        Configuración de Playwright y del reporter de QAtlas
├── qatlas-reporter.cjs         Reporter que envía los resultados a QAtlas
├── .env                        Credenciales y configuración local (no se sube al repositorio)
└── testsProyecto/
    ├── setup/
    │   └── auth.setup.ts       Inicia sesión como administrador y como cliente y guarda las sesiones
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
        ├── helpers/
        │   └── pedidos.ts      Productos de referencia y consultas a la base de datos
        ├── AgregarAlCarrito/
        ├── GestionDelCarrito/
        ├── ProcesoDeCheckout/
        └── HistorialDePedidos/
```

Las pruebas viven dentro del proyecto de EverShop porque algunas necesitan sus archivos: ES-TC-19 escribe en `translations/es/` y reinicia el servidor.

## Requisitos

- EverShop 2.2.1 instalado y funcionando en `http://localhost:3000`.
- PostgreSQL en ejecución, con la base de datos de EverShop.
- Node.js 20.12 o superior (se usó la v20.20.2).
- Una cuenta de administrador y una de cliente creadas en EverShop.
- Para ES-TC-25, el producto "Camiseta Básica" (URL key `camiseta-basica`) creado a mano con sus variantes. Ver [orders/README.md](orders/README.md).
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
| `CAMISETA_URL_KEY` | Opcional. URL key del producto con variantes de ES-TC-25 (por defecto `camiseta-basica`) |

El `.env` contiene contraseñas y el token, así que nunca debe subirse al repositorio.

## Cómo ejecutar las pruebas

EverShop debe estar corriendo (`npm run start`) antes de ejecutar las pruebas. Cada corrida inicia sesión primero (proyecto `setup`) y después ejecuta los tests.

Probar sin subir resultados a QAtlas:

```bash
npx playwright test --reporter=list                           # todas
npx playwright test auth --reporter=list                      # un módulo
npx playwright test GestionDeIdiomas --reporter=list          # una suite
npx playwright test tc-ord-22 --reporter=list                 # un caso
```

Ejecutar y subir los resultados a QAtlas, con un nombre de ejecución equivalente al de la ejecución manual:

```bash
# Autenticación y cuentas
QATLAS_RUN_NAME="Ejecución Automatizada Registro de Usuarios" npx playwright test RegistroDeUsuarios
QATLAS_RUN_NAME="Ejecución Automatizada Inicio de Sesión Cliente" npx playwright test InicioSesionCliente
QATLAS_RUN_NAME="Ejecución Automatizada Inicio de Sesión Administrador" npx playwright test InicioSesionAdministrador
QATLAS_RUN_NAME="Ejecución Automatizada Cierre de Sesión" npx playwright test CierreSesion

# Catálogo de productos
QATLAS_RUN_NAME="Ejecución Automatizada Gestión Idiomas" npx playwright test GestionDeIdiomas
QATLAS_RUN_NAME="Ejecución Automatizada Gestión Productos" npx playwright test GestionDeProductos
QATLAS_RUN_NAME="Ejecución Automatizada Búsqueda y Filtrado" npx playwright test BusquedaYFiltradoDeProductos

# Compras y pedidos
QATLAS_RUN_NAME="Ejecución Automatizada Agregar al Carrito" npx playwright test AgregarAlCarrito
QATLAS_RUN_NAME="Ejecución Automatizada Gestión del Carrito" npx playwright test GestionDelCarrito
QATLAS_RUN_NAME="Ejecución Automatizada Checkout" npx playwright test ProcesoDeCheckout
QATLAS_RUN_NAME="Ejecución Automatizada Historial de Pedidos" npx playwright test HistorialDePedidos
```

Otras herramientas útiles:

```bash
npx playwright test --ui                 # modo visual para depurar
npx playwright show-report               # reporte HTML con capturas, video y trace
npx playwright codegen --load-storage=playwright/.auth/admin.json http://localhost:3000/admin
npx playwright codegen --load-storage=playwright/.auth/cliente.json http://localhost:3000
```

## Integración con QAtlas

El archivo `qatlas-reporter.cjs` es una copia modificada del reporter oficial de QAtlas. Al terminar cada corrida:

1. Crea una ejecución en QAtlas y registra el resultado de cada caso, paso por paso cuando el test usa `test.step`.
2. Sube la evidencia (captura, video y trace) indicando el paso al que pertenece, para que se muestre en la ejecución.
3. Cuando un test falla, busca si el caso ya tiene un defecto abierto. Si existe, vincula la ejecución a ese defecto y le agrega la captura, en lugar de crear un duplicado. Si no existe, crea uno nuevo con los pasos, el resultado esperado y el resultado obtenido.
4. Marca la ejecución como completada.

Las modificaciones respecto al reporter oficial son los puntos 2 (evidencia con número de paso), 3 (defectos sin duplicar) y 4 (cierre automático de la ejecución).

## Convenciones

- Nombre de archivo: `tc-<módulo>-XX-descripcion.test.ts` (`tc-auth`, `tc-cat` o `tc-ord`).
- Título del test: `@ES-TC-X Título del caso`, más la anotación `{ type: 'qatlas', description: 'ES-TC-X' }`.
- Un `test.step` por cada paso del caso, con el mismo texto de la acción. Al final de cada paso se verifica su resultado esperado.
- Los datos de prueba son los definidos en QAtlas, incluidos los de la columna "Datos de prueba".
- La sesión depende de la precondición del caso: `admin.json` si dice administrador, `cliente.json` si dice cliente, y sin `storageState` (o con uno vacío) cuando el caso prueba el propio inicio o cierre de sesión.
- Cada test deja el sistema como lo encontró: restaura el idioma predeterminado, devuelve el precio original o borra los productos, clientes y datos que crea.
- Los datos que EverShop exige pero que no forman parte del caso (SKU, URL key, Meta Title, peso y clase de impuesto) se llenan con valores fijos que no chocan con los productos existentes.

## Hallazgos principales

Defectos abiertos en QAtlas (ver `incidencias.csv` en la raíz del repositorio).

### Autenticación y cuentas

| Defecto | Hallazgo |
|---|---|
| ES-BUG-19 | Al registrarse con un correo ya registrado no aparece un mensaje que indique que el correo está en uso. |
| ES-BUG-20 | No se muestra un mensaje que confirme que se inició sesión correctamente. |

### Catálogo de productos

| Defecto | Hallazgo |
|---|---|
| ES-BUG-4 | La lista de idiomas muestra 182 opciones en lugar de solo los configurados (Español e English). |
| ES-BUG-5 | Al cambiar el idioma predeterminado, los cambios no se guardan. |
| ES-BUG-6, ES-BUG-12 | La tienda no ofrece un control para que el cliente cambie el idioma. |
| ES-BUG-13 | Algunos elementos de la interfaz no se traducen al cambiar a español. |
| ES-BUG-7 | El formulario de producto pide campos que no están definidos en los requerimientos. |
| ES-BUG-9 | El formulario de producto no incluye el campo de marca que pide REQ-CAT-002. |
| ES-BUG-8 | Al eliminar un producto no se muestra un mensaje de confirmación. |
| ES-BUG-10, ES-BUG-11 | Los filtros solo existen dentro de cada categoría: no aparecen al hacer una búsqueda y no permiten filtrar por categoría. |

### Compras y pedidos

| Defecto | Hallazgo |
|---|---|
| ES-BUG-16 | Las tallas de EverShop son SM, XL y XXL; no existe la talla M del caso, así que se usa SM. |
| ES-BUG-17, ES-BUG-18 | El checkout pide más datos que los definidos en el caso y no tiene cantón, distrito ni dirección exacta (usa City, Address 2 y Address). |
| ES-BUG-15 | Para que el cliente vea un cambio de estado en su pedido, el administrador primero debe aceptar el pago. |

## Notas

- ES-TC-19 reinicia EverShop: detiene el proceso que corre en el puerto 3000, lo vuelve a iniciar con `npm run start` y, al terminar, restaura el idioma y borra el archivo de traducción de prueba. EverShop debe iniciarse desde la terminal de VS Code para que el test pueda detenerlo.
- ES-TC-56 cambia temporalmente el tiempo de expiración de la sesión administrativa; si falla al autenticar, conviene ejecutarlo solo (ver ES-BUG-14, ya cerrado).
- ES-TC-38 y ES-TC-40 crean pedidos reales (pago contra entrega) si el cliente no tiene suficientes. ES-TC-42 registra un cliente nuevo sin pedidos y lo borra al terminar.
- Los selectores de mensajes de error de ES-TC-23, 24, 25 y 35 son tolerantes; si cambian en tu entorno, ajústalos con `codegen`.
- Si el inicio de sesión falla de forma intermitente justo después de prender EverShop, normalmente es porque el servidor todavía está cargando; basta con volver a ejecutar.
