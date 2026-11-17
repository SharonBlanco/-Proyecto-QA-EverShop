import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, filaCarrito, botonMas, cantidadFila, totalesCarrito, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-5 Gestión del carrito de compras', () => {
  const TIEMPO_MAXIMO_MS = 3000; // umbral del caso: 3 segundos

  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 1 }]);
  });

  test('@ES-TC-33 Tiempo de respuesta al modificar la cantidad en el carrito', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-33' });
    let inicio = 0;

    await test.step('Abrir la página del carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: se muestra “Taza Cerámica Azul” con cantidad 1
      await expect(filaCarrito(page, TAZA.nombre)).toBeVisible();
      await expect(cantidadFila(filaCarrito(page, TAZA.nombre))).toHaveText('1');
    });

    await test.step('Cambiar la cantidad a 3 e iniciar la medición del tiempo', async () => {
      inicio = Date.now();
      await botonMas(filaCarrito(page, TAZA.nombre)).click();
      await botonMas(filaCarrito(page, TAZA.nombre)).click();
      // Resultado esperado: la solicitud de actualización se envía
      await page.waitForResponse((r) => /\/api\/cart\/[^/]+\/items\/[^/]+/.test(r.url()) && r.request().method() === 'PATCH');
    });

    await test.step('Esperar a que se actualicen el subtotal y el total y detener la medición', async () => {
      await expect(totalesCarrito(page).subtotal).toContainText(monto(45000), { timeout: 15_000 });
      const transcurrido = Date.now() - inicio;
      // Resultado esperado: el subtotal muestra 45000 en 3 segundos o menos
      expect(transcurrido, `Actualizar el carrito tardó ${transcurrido} ms; el máximo es ${TIEMPO_MAXIMO_MS} ms`).toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
