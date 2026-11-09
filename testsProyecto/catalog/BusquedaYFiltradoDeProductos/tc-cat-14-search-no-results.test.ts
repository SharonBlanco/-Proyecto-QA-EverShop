import { test, expect} from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-14 Búsqueda sin resultados', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-14' });


   await test.step('Ingresar "xyzproductoinexistente" en la barra de búsqueda', async () => {
      await page.getByRole('link', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).pressSequentially('xyzproductoinexistente');
      // Resultado esperado: el término se muestra en la barra
      await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('xyzproductoinexistente');
    });

    await test.step('Ejecutar la búsqueda', async () => {
      await page.keyboard.press('Enter');

      // Resultado esperado: el sistema indica que no hay productos
      await expect(page.getByRole('paragraph')).toContainText('No products found');
    });
  });

});