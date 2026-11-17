import { test, expect } from '@playwright/test';
import { SIN_STOCK, asegurarProducto, vaciarCarrito, obtenerCarrito, abrirProducto, cantidadEnIndicador } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  let urlKey: string;

  test.beforeEach(async ({ page }) => {
    urlKey = (await asegurarProducto(SIN_STOCK)).urlKey; // inventario = 0
    await vaciarCarrito(page);
  });

  test('@ES-TC-26 Agregar al carrito un producto sin stock', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-26' });

    await test.step('Abrir el detalle del producto “Producto Sin Stock”', async () => {
      await abrirProducto(page, urlKey);
      // Resultado esperado: se muestra la página del producto
      await expect(page.getByRole('heading', { name: SIN_STOCK.nombre })).toBeVisible();
    });

    await test.step('Revisar la opción de agregar al carrito', async () => {
      // Resultado esperado: la opción está deshabilitada
      await expect(page.getByRole('button', { name: /add to cart|sold out/i })).toBeDisabled();
    });

    await test.step('Intentar seleccionar la opción de agregar al carrito', async () => {
      await page.getByRole('button', { name: /add to cart|sold out/i }).click({ force: true, trial: false }).catch(() => {});
      // Resultado esperado: el sistema no agrega el producto y el carrito sigue vacío
      expect(await cantidadEnIndicador(page)).toBe(0);
      expect((await obtenerCarrito(page))?.totalQty ?? 0).toBe(0);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
