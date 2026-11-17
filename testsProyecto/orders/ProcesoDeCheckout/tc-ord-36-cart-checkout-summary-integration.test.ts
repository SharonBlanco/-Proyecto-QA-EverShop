import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, obtenerCarrito, consultarBD, filaCarrito, botonMas, totalesCarrito, irAlCheckoutDesdeCarrito, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-6 Proceso de checkout', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 1 }]);
  });

  test('@ES-TC-36 Integración entre el carrito y el resumen del checkout', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-36' });

    await test.step('Abrir el carrito y cambiar la cantidad de “Taza Cerámica Azul” a 4', async () => {
      await page.goto('/cart');
      for (let i = 2; i <= 4; i++) {
        await botonMas(filaCarrito(page, TAZA.nombre)).click();
        await expect(filaCarrito(page, TAZA.nombre).locator('span.w-8')).toHaveText(String(i));
      }
      // Resultado esperado: el subtotal del carrito se actualiza a 60000
      await expect(totalesCarrito(page).subtotal).toContainText(monto(60000));
    });

    await test.step('Consultar los ítems del carrito del cliente en la base de datos', async () => {
      const carrito = await obtenerCarrito(page);
      const filas = await consultarBD(
        `SELECT ci.qty FROM cart_item ci JOIN cart c ON c.cart_id = ci.cart_id WHERE c.uuid = $1 AND ci.product_name = $2`,
        [carrito.uuid, TAZA.nombre],
      );
      // Resultado esperado: el registro del producto tiene cantidad 4
      expect(filas).toHaveLength(1);
      expect(filas[0].qty).toBe(4);
    });

    await test.step('Continuar al checkout', async () => {
      await irAlCheckoutDesdeCarrito(page);
      // Resultado esperado: se muestra el formulario de checkout
      await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
    });

    await test.step('Revisar el resumen del pedido', async () => {
      const resumen = page.locator('.item__summary__list').first();
      // Resultado esperado: el resumen muestra el producto con cantidad 4 y un subtotal de 60000
      await expect(resumen).toContainText(TAZA.nombre);
      await expect(resumen).toContainText(/^\s*4(?=\D)/); // el resumen muestra la cantidad antes del nombre
      await expect(page.getByText('Sub total', { exact: true }).first().locator('..')).toContainText(monto(60000));
    });

    await test.step('Consultar el carrito mediante la API GraphQL', async () => {
      const carrito = await obtenerCarrito(page);
      const item = carrito.items.find((i: any) => i.productName === TAZA.nombre);
      // Resultado esperado: la API devuelve el producto con cantidad 4 y un subtotal de 60000, iguales a los del resumen
      expect(item.qty).toBe(4);
      expect(carrito.subTotal.value).toBe(60000);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});