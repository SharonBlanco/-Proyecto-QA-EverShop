import { test, expect } from '@playwright/test';
import { CAMISETA_NOMBRE, CAMISETA_URL_KEY, vaciarCarrito, filaCarrito, cantidadEnIndicador } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

// El caso en QAtlas pide la talla "M". En la tienda solo existe "SM" (hallazgo ES-BUG-16): la prueba verifica
// la talla M tal cual el caso y, si no existe, usa SM únicamente para poder seguir con los pasos siguientes.
const COLOR = 'White';
const TALLA_CASO = 'M';
const TALLA_DISPONIBLE = 'SM';

test.describe('ES-4 Agregar productos al carrito de compras', () => {
  const opciones = (page: import('@playwright/test').Page) => page.locator('.variant-option-list');

  test.beforeEach(async ({ page }) => {
    await vaciarCarrito(page);
  });

  test('@ES-TC-25 Agregar producto con variantes seleccionando una opción', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-25' });

    await test.step('Abrir el detalle del producto “Camiseta Básica”', async () => {
      await page.goto(`/${CAMISETA_URL_KEY}`);
      // Resultado esperado: se muestran las opciones de color y talla sin ninguna seleccionada
      await expect(opciones(page).getByRole('button', { name: TALLA_DISPONIBLE, exact: true })).toBeVisible();
      await expect(opciones(page).getByRole('button', { name: COLOR, exact: true })).toBeVisible();
      await expect(page.locator('.variant-option-list li.selected')).toHaveCount(0);
    });

    await test.step('Seleccionar la opción de agregar al carrito sin elegir las opciones', async () => {
      await page.getByRole('button', { name: 'Add to cart' }).click();
      // Resultado esperado: el sistema no agrega el producto y solicita seleccionar las opciones
      await expect(page.getByText(/please select variant options/i)).toBeVisible();
      expect(await cantidadEnIndicador(page)).toBe(0);
    });

    await test.step('Seleccionar la talla M', async () => {
      await opciones(page).getByRole('button', { name: COLOR, exact: true }).click();
      await expect(page.locator('.variant-option-list li.selected')).toHaveCount(1);
      const tallaM = opciones(page).getByRole('button', { name: TALLA_CASO, exact: true });
      const existe = (await tallaM.count()) > 0;
      // Resultado esperado: la talla M queda seleccionada (si la talla M no existe, el paso falla)
      expect.soft(existe, 'La talla "M" del caso no existe en el producto (solo hay "SM")').toBe(true);
      await (existe ? tallaM : opciones(page).getByRole('button', { name: TALLA_DISPONIBLE, exact: true })).click();
      await expect.soft(page.locator('.variant-option-list li.selected')).toHaveCount(2);
    });

    await test.step('Seleccionar la opción de agregar al carrito', async () => {
      await page.getByRole('button', { name: 'Add to cart' }).click();
      // Resultado esperado: el sistema agrega el producto al carrito
      await expect.poll(async () => cantidadEnIndicador(page)).toBe(1);
    });

    await test.step('Abrir el carrito', async () => {
      await page.goto('/cart');
      // Resultado esperado: “Camiseta Básica” aparece en el carrito con la talla M
      await expect(filaCarrito(page, CAMISETA_NOMBRE)).toBeVisible();
      await expect.soft(filaCarrito(page, CAMISETA_NOMBRE), 'El carrito no muestra la talla M').toContainText(/\bM\b/);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
