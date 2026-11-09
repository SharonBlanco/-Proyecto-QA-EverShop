import { test, expect} from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });


test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-17 Búsqueda con caracteres especiales', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-17' });


   await test.step('Ingresar "<>%$#\'" en la barra de búsqueda', async () => {
      await page.getByRole('link', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).pressSequentially('<>%$#\'');
      // Resultado esperado: el término se muestra en la barra
      await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('<>%$#\'');
    });

    await test.step('Ejecutar la búsqueda', async () => {
      const respuesta = page.waitForResponse((r) => r.url().includes('/search'));
      await page.keyboard.press('Enter');

      // Resultado esperado: el sistema no presenta errores…
      expect((await respuesta).status(), 'La búsqueda no debe dar error del servidor').toBeLessThan(500);
      await expect(page.getByRole('paragraph')).toContainText('No products found');
    });
  });

});