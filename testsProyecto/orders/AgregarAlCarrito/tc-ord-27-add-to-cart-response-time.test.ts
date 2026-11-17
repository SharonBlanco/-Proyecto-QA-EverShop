import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, vaciarCarrito, abrirProducto, indicadorCarrito } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  const TIEMPO_MAXIMO_MS = 3000; // umbral del caso: 3 segundos
  let urlKey: string;

  test.beforeEach(async ({ page }) => {
    urlKey = (await asegurarProducto(TAZA)).urlKey;
    await vaciarCarrito(page);
  });

  test('@ES-TC-27 Tiempo de respuesta al agregar un producto al carrito', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-27' });
    let inicio = 0;

    await test.step('Abrir el detalle del producto “Taza Cerámica Azul”', async () => {
      await abrirProducto(page, urlKey);
      // Resultado esperado: se muestra la página del producto
      await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    });

    await test.step('Ingresar la cantidad 1, seleccionar la opción de agregar al carrito e iniciar la medición del tiempo', async () => {
      await page.getByRole('spinbutton', { name: /quantity/i }).fill('1');
      inicio = Date.now();
      await page.getByRole('button', { name: 'Add to cart' }).click();
      // Resultado esperado: la solicitud de agregar al carrito se envía
      await page.waitForResponse((r) => /\/api\/cart\/[^/]+\/items\/?(\?.*)?$/.test(r.url()) && r.request().method() === 'POST');
    });

    await test.step('Esperar a que el indicador del carrito se actualice y detener la medición', async () => {
      await expect(indicadorCarrito(page)).toHaveAttribute('aria-label', /with 1 items?/i, { timeout: 15_000 });
      const transcurrido = Date.now() - inicio;
      // Resultado esperado: el indicador muestra 1 artículo en 3 segundos o menos
      expect(transcurrido, `Agregar al carrito tardó ${transcurrido} ms; el máximo es ${TIEMPO_MAXIMO_MS} ms`).toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
