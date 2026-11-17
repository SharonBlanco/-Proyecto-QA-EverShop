import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, contarPedidosDelCliente, hacerPedidoPorUI, vaciarCarrito } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-7 Historial de pedidos del cliente', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    // Precondición: el cliente tiene al menos dos pedidos (los pedidos creados quedan como datos del cliente de prueba)
    while ((await contarPedidosDelCliente(process.env.CLIENTE_EMAIL!.trim())) < 2) {
      await hacerPedidoPorUI(page, sku, 1);
    }
    await vaciarCarrito(page);
  });

  test('@ES-TC-38 Visualizar el historial de pedidos del cliente', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-38' });

    await test.step('Acceder a la sección de pedidos desde la cuenta del cliente', async () => {
      await page.goto('/account');
      await page.getByRole('link', { name: /orders/i }).first().click();
      await page.waitForURL(/\/account\/orders/);
      // Resultado esperado: se muestra la lista de pedidos realizados
      await expect(page.locator('a[href^="/account/orders/"]').first()).toBeVisible();
    });

    await test.step('Revisar cada pedido de la lista', async () => {
      const pedidos = page.locator('a[href^="/account/orders/"]');
      expect(await pedidos.count()).toBeGreaterThanOrEqual(2);
      // Resultado esperado: cada pedido muestra número de orden, fecha, total y estado
      for (let i = 0; i < (await pedidos.count()); i++) {
        const p = pedidos.nth(i);
        await expect(p, 'Número de orden').toContainText(/#\s*\d+/);
        await expect(p, 'Fecha').toContainText(/\d{1,4}[\/\-.,\s]|[A-Za-z]{3,}\s+\d{1,2}/);
        await expect(p, 'Total').toContainText(/\d[\d.,\s]*\d/);
        await expect(p.locator('span.rounded-full').last(), 'Estado').toBeVisible();
      }
    });
  });
});
