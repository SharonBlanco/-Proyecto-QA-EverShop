import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, filaCarrito } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-6 Proceso de checkout', () => {
  const TIEMPO_MAXIMO_MS = 5000; // umbral del caso: 5 segundos

  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 2 }]);
  });

  test('@ES-TC-37 Tiempo de respuesta al cargar el checkout', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-37' });
    let inicio = 0;

    await test.step('Abrir la página del carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: se muestra el carrito con el producto
      await expect(filaCarrito(page, TAZA.nombre)).toBeVisible();
    });

    await test.step('Seleccionar continuar al checkout e iniciar la medición del tiempo', async () => {
      inicio = Date.now();
      await page.getByRole('button', { name: /proceed to checkout/i }).click();
      // Resultado esperado: la solicitud de carga del checkout se envía
      await page.waitForURL(/\/checkout/);
    });

    await test.step('Esperar a que se muestre el formulario de checkout con el resumen del pedido y detener la medición', async () => {
      await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.item__summary__list').first()).toContainText(TAZA.nombre);
      const transcurrido = Date.now() - inicio;
      // Resultado esperado: el checkout se muestra completo en 5 segundos o menos
      expect(transcurrido, `El checkout tardó ${transcurrido} ms; el máximo es ${TIEMPO_MAXIMO_MS} ms`).toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
