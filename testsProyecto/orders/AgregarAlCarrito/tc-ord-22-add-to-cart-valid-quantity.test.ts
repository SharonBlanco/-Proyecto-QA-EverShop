import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, vaciarCarrito, abrirProducto, agregarDesdeProducto, indicadorCarrito, cantidadEnIndicador } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  let urlKey: string;

  test.beforeEach(async ({ page }) => {
    urlKey = (await asegurarProducto(TAZA)).urlKey;
    await vaciarCarrito(page);
  });

  test('@ES-TC-22 Agregar producto al carrito con cantidad válida', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-22' });

    await test.step('Abrir el detalle del producto “Taza Cerámica Azul” en la tienda', async () => {
      await abrirProducto(page, urlKey);
      // Resultado esperado: se muestra la página del producto con el campo de cantidad y la opción de agregar al carrito
      await expect(page.getByRole('spinbutton', { name: /quantity/i })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    });

    await test.step('Ingresar la cantidad 2', async () => {
      await page.getByRole('spinbutton', { name: /quantity/i }).fill('2');
      // Resultado esperado: el campo acepta el valor ingresado
      await expect(page.getByRole('spinbutton', { name: /quantity/i })).toHaveValue('2');
    });

    await test.step('Seleccionar la opción de agregar al carrito', async () => {
      await page.getByRole('button', { name: 'Add to cart' }).click();
      // Resultado esperado: el sistema agrega el producto al carrito
      await expect(indicadorCarrito(page)).toHaveAttribute('aria-label', /with 2 items?/i);
    });

    await test.step('Revisar el indicador del carrito', async () => {
      // Resultado esperado: el indicador muestra 2 artículos
      expect(await cantidadEnIndicador(page)).toBe(2);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
