import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, filaCarrito, botonMas, cantidadFila, totalesCarrito, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-5 Gestión del carrito de compras', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 1 }]);
  });

  test('@ES-TC-30 Modificar la cantidad de un producto desde el carrito', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-30' });
    const fila = () => filaCarrito(page, TAZA.nombre);

    await test.step('Abrir la página del carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: se muestra “Taza Cerámica Azul” con cantidad 1 y subtotal de 15000
      await expect(fila()).toBeVisible();
      await expect(cantidadFila(fila())).toHaveText('1');
      await expect(totalesCarrito(page).subtotal).toContainText(monto(15000));
    });

    await test.step('Cambiar la cantidad del producto a 3', async () => {
      await botonMas(fila()).click();
      await expect(fila().locator('span.w-8')).toHaveText('2');
      await botonMas(fila()).click();
      // Resultado esperado: el campo muestra la cantidad 3
      await expect(fila().locator('span.w-8')).toHaveText('3');
    });

    await test.step('Revisar el subtotal y el total del carrito', async () => {
      // Resultado esperado: el subtotal se actualiza a 45000 y el total se recalcula en función del nuevo subtotal
      await expect(totalesCarrito(page).subtotal).toContainText(monto(45000));
      await expect(totalesCarrito(page).total).toContainText(monto(45000));
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
