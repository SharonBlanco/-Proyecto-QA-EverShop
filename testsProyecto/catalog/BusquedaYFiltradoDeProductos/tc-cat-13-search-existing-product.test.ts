import { test, expect} from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-13 Buscar producto por nombre existente', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-13' });


   await test.step('Ingresar el nombre del producto en la barra de búsqueda', async () => {
      await page.getByRole('link', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).pressSequentially('Taza Cerámica Azul');
      // Resultado esperado: el término se muestra en la barra
      await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('Taza Cerámica Azul');
    });

    await test.step('Ejecutar la búsqueda', async () => {
      await page.keyboard.press('Enter');

      // Resultado esperado: el sistema muestra el producto
      
      await expect(page.getByRole('heading', { name: 'Taza Cerámica Azul', exact: true })).toBeVisible();

    });
  });

});