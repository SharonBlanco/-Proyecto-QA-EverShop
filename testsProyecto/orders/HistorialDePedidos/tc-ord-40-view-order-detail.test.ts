import { test, expect } from '@playwright/test';
import { CHORREADOR, asegurarProducto, hacerPedidoPorUI, vaciarCarrito, consultarBD, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-7 Historial de pedidos del cliente', () => {
  const CANTIDAD = 3; // cantidad conocida del pedido: 3 x Chorreador de Café (20000) = 60000
  let uuidPedido = '';

  test.beforeEach(async ({ page }) => {
    // Precondición del caso: un pedido con productos y cantidades conocidos (el más reciente del cliente)
    const { sku } = await asegurarProducto(CHORREADOR);
    await hacerPedidoPorUI(page, sku, CANTIDAD);
    await vaciarCarrito(page);
    // El pedido recién creado es el último del cliente; se identifica por su uuid (la lista no está ordenada por fecha)
    const filas = await consultarBD(
      `SELECT o.uuid FROM "order" o JOIN customer c ON c.customer_id = o.customer_id
        WHERE c.email = $1 ORDER BY o.order_id DESC LIMIT 1`,
      [process.env.CLIENTE_EMAIL!.trim()],
    );
    uuidPedido = filas[0].uuid;
  });

  test('@ES-TC-40 Ver el detalle de un pedido', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-40' });

    await test.step('Acceder a la sección de pedidos desde la cuenta del cliente', async () => {
      await page.goto('/account/orders');
      // Resultado esperado: se muestra la lista de pedidos realizados
      await expect(page.locator('a[href^="/account/orders/"]').first()).toBeVisible();
    });

    await test.step('Seleccionar un pedido de la lista', async () => {
      await page.locator(`a[href="/account/orders/${uuidPedido}"]`).click();
      // Resultado esperado: se muestra el detalle del pedido
      await page.waitForURL(/\/account\/orders\/[\w-]+/);
      await expect(page.getByRole('heading', { name: /order summary/i })).toBeVisible();
    });

    await test.step('Revisar el detalle del pedido', async () => {
      const resumen = page.locator('section').filter({ has: page.getByRole('heading', { name: /order summary/i }) });
      // Resultado esperado: los productos, cantidades y precios coinciden con los del pedido creado (3 x 20000 = 60000)
      await expect(resumen).toContainText(new RegExp(`(^|\\D)${CANTIDAD}\\s*${CHORREADOR.nombre.slice(0, 11)}`));
      await expect(resumen).toContainText(monto(CHORREADOR.precio * CANTIDAD));
    });
  });
});