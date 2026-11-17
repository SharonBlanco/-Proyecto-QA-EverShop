import { test, expect } from '@playwright/test';
import { TAZA, CHORREADOR, asegurarProducto, prepararCarrito, vaciarCarrito, filaCarrito, cantidadFila, totalesCarrito, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-5 Gestión del carrito de compras', () => {
  test.beforeEach(async ({ page }) => {
    const taza = await asegurarProducto(TAZA);
    const chorreador = await asegurarProducto(CHORREADOR);
    await prepararCarrito(page, [{ sku: taza.sku, qty: 2 }, { sku: chorreador.sku, qty: 1 }]);
  });

  test('@ES-TC-31 Eliminar un producto individual del carrito', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-31' });

    await test.step('Abrir la página del carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: se muestran ambos productos y el subtotal es 50000
      await expect(filaCarrito(page, TAZA.nombre)).toBeVisible();
      await expect(filaCarrito(page, CHORREADOR.nombre)).toBeVisible();
      await expect(totalesCarrito(page).subtotal).toContainText(monto(50000));
    });

    await test.step('Eliminar el producto “Chorreador de Café”', async () => {
      await filaCarrito(page, CHORREADOR.nombre).getByRole('button', { name: /remove/i }).click();
      // Resultado esperado: el producto desaparece del carrito
      await expect(filaCarrito(page, CHORREADOR.nombre)).toHaveCount(0);
    });

    await test.step('Revisar el contenido y el subtotal del carrito', async () => {
      // Resultado esperado: solo permanece “Taza Cerámica Azul” con cantidad 2 y el subtotal es 30000
      await expect(page.locator('.cart__item')).toHaveCount(1);
      await expect(cantidadFila(filaCarrito(page, TAZA.nombre))).toHaveText('2');
      await expect(totalesCarrito(page).subtotal).toContainText(monto(30000));
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
