# Pruebas automatizadas del módulo Compras y pedidos (REQ-ORD-001 a 004)

Responsable: Jose Armando Cordero Miranda. Casos en QAtlas: ES-TC-22 a ES-TC-38, ES-TC-40, ES-TC-42 (automatizados) y ES-TC-29, ES-TC-44 (manuales).

## Dónde copiar
Copiar la carpeta `orders/` dentro de `testsProyecto/` (al lado de `catalog/`). Cada archivo se llama `tc-ord-<número del ES-TC>-<descripcion>.test.ts`, así `npx playwright test tc-ord-22` ejecuta solo ese caso.

## Datos de referencia
Las precondiciones se dejan listas solas (helpers/pedidos.ts, `asegurarProducto`): crea "Taza Cerámica Azul", "Chorreador de Café" y "Producto Sin Stock" si no existen y fija precio y stock. Si ya los tienes (la taza de Sharon), los reutiliza.
Única creación manual: "Camiseta Básica" (URL Key camiseta-basica) con variantes White/SM, Black/XL y Yellow/XXL, stock 10 cada una, para ES-TC-25.

## Comandos
Probar sin subir a QAtlas:
    npx playwright test tc-ord-22 --reporter=list
    npx playwright test orders --reporter=list
Subir a QAtlas con nombre:
    QATLAS_RUN_NAME="Ejecución Automatizada Agregar al Carrito" npx playwright test AgregarAlCarrito
    QATLAS_RUN_NAME="Ejecución Automatizada Gestión del Carrito" npx playwright test GestionDelCarrito
    QATLAS_RUN_NAME="Ejecución Automatizada Checkout" npx playwright test ProcesoDeCheckout
    QATLAS_RUN_NAME="Ejecución Automatizada Historial de Pedidos" npx playwright test HistorialDePedidos

## Notas
- Las pruebas usan la sesión del cliente (`cliente.json`); ES-TC-42 registra un cliente nuevo sin pedidos y lo borra al terminar.
- ES-TC-38 y ES-TC-40 crean pedidos reales (pago contra entrega) si el cliente tiene menos de los necesarios.
- Los resultados esperados salen de los requisitos. EverShop no tiene "cantón", "distrito" ni "dirección exacta" (usa City, Address 2 y Address) y no tiene botón "Continuar" en el checkout; se usan los equivalentes y se reporta como hallazgo.
- Los selectores de mensajes de error (ES-TC-23, 24, 25, 35) son tolerantes pero hay que verificarlos con la primera corrida; ajustar con `npx playwright codegen --load-storage=playwright/.auth/cliente.json http://localhost:3000`.
