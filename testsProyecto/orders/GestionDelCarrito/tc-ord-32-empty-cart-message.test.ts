import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, filaCarrito } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-5 Gestión del carrito de compras', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 1 }]);
  });

  test('@ES-TC-32 Mostrar mensaje al eliminar el último producto del carrito', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-32' });

    await test.step('Abrir la página del carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: se muestra “Taza Cerámica Azul” en el carrito
      await expect(filaCarrito(page, TAZA.nombre)).toBeVisible();
    });

    await test.step('Eliminar el único producto del carrito', async () => {
      await filaCarrito(page, TAZA.nombre).getByRole('button', { name: /remove/i }).click();
      // Resultado esperado: el producto desaparece de la lista
      await expect(filaCarrito(page, TAZA.nombre)).toHaveCount(0);
    });

    await test.step('Revisar la página del carrito', async () => {
      // Resultado esperado: se muestra un mensaje indicando que el carrito está vacío
      await expect(page.getByText(/your cart is empty/i).first()).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
