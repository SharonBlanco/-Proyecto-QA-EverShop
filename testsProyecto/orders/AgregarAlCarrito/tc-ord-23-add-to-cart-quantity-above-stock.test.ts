import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, vaciarCarrito, obtenerCarrito, abrirProducto, indicadorCarrito, cantidadEnIndicador } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  let urlKey: string;

  test.beforeEach(async ({ page }) => {
    urlKey = (await asegurarProducto(TAZA)).urlKey; // stock = 10
    await vaciarCarrito(page);
  });

  test('@ES-TC-23 Agregar producto con cantidad mayor al stock disponible', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-23' });

    await test.step('Abrir el detalle del producto “Taza Cerámica Azul”', async () => {
      await abrirProducto(page, urlKey);
      // Resultado esperado: se muestra la página del producto
      await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    });

    await test.step('Ingresar la cantidad 11', async () => {
      await page.getByRole('spinbutton', { name: /quantity/i }).fill('11');
      // Resultado esperado: el campo muestra la cantidad ingresada
      await expect(page.getByRole('spinbutton', { name: /quantity/i })).toHaveValue('11');
    });

    await test.step('Seleccionar la opción de agregar al carrito', async () => {
      await page.getByRole('button', { name: 'Add to cart' }).click();
      // Resultado esperado: no se agrega y se muestra un mensaje de que la cantidad solicitada no está disponible
      await expect(
        page.locator('[data-sonner-toast], [role="alert"], [role="status"]').filter({ hasText: /stock|available|quantity|qty|insufficient/i }).first(),
        'Debe mostrarse un mensaje indicando que la cantidad solicitada no está disponible',
      ).toBeVisible();
    });

    await test.step('Revisar el indicador del carrito', async () => {
      // Resultado esperado: el indicador no cambia y el carrito sigue vacío
      expect(await cantidadEnIndicador(page)).toBe(0);
      expect((await obtenerCarrito(page))?.totalQty ?? 0).toBe(0);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
