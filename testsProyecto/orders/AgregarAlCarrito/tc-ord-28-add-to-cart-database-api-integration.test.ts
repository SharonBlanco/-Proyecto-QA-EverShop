import { test, expect } from '@playwright/test';
import { CHORREADOR, asegurarProducto, vaciarCarrito, obtenerCarrito, consultarBD, abrirProducto, agregarDesdeProducto, indicadorCarrito, filaCarrito, cantidadFila } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  let urlKey: string;

  test.beforeEach(async ({ page }) => {
    urlKey = (await asegurarProducto(CHORREADOR)).urlKey;
    await vaciarCarrito(page);
  });

  test('@ES-TC-28 Integración entre agregar al carrito, la base de datos y la API', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-28' });
    let enBD: any;

    await test.step('Agregar 3 unidades del producto “Chorreador de Café” al carrito', async () => {
      await abrirProducto(page, urlKey);
      await agregarDesdeProducto(page, 3);
      // Resultado esperado: el indicador del carrito muestra 3 artículos
      await expect(indicadorCarrito(page)).toHaveAttribute('aria-label', /with 3 items?/i);
    });

    await test.step('Consultar los ítems del carrito del cliente en la base de datos', async () => {
      const carrito = await obtenerCarrito(page);
      const filas = await consultarBD(
        `SELECT ci.product_name, ci.qty, ci.product_price
           FROM cart_item ci JOIN cart c ON c.cart_id = ci.cart_id
          WHERE c.uuid = $1 AND ci.product_name = $2`,
        [carrito.uuid, CHORREADOR.nombre],
      );
      // Resultado esperado: existe un registro del producto con cantidad 3 y precio 20000
      expect(filas, 'Debe existir exactamente un registro del producto en el carrito').toHaveLength(1);
      enBD = filas[0];
      expect(enBD.qty).toBe(3);
      expect(Number(enBD.product_price)).toBe(CHORREADOR.precio);
    });

    await test.step('Consultar el carrito mediante la API GraphQL', async () => {
      const carrito = await obtenerCarrito(page);
      const item = carrito.items.find((i: any) => i.productName === CHORREADOR.nombre);
      // Resultado esperado: la API devuelve el producto con los mismos datos almacenados en la base de datos
      expect(item, 'La API debe devolver el producto').toBeTruthy();
      expect(item.qty).toBe(enBD.qty);
      expect(item.productPrice.value).toBe(Number(enBD.product_price));
    });

    await test.step('Abrir la página del carrito en la tienda', async () => {
      await page.goto('/cart');
      // Resultado esperado: la página muestra el producto con cantidad 3
      await expect(filaCarrito(page, CHORREADOR.nombre)).toBeVisible();
      await expect(cantidadFila(filaCarrito(page, CHORREADOR.nombre))).toHaveText('3');
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
