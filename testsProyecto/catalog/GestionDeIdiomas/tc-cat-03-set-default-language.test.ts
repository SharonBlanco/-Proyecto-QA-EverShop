import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });


test.describe('ES-1 Gestión de idiomas de la tienda', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/setting/store');
  });

  test('@ES-TC-3 Establecer idioma predeterminado de la tienda', async ({ page, browser }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-3' });

       // Resultado esperado: se muestra la configuración actual
    await test.step('Acceder a la configuración de idiomas', async () => {
      await expect(page.locator('#field-storeLanguage')).toContainText('English');
    });

    // Resultado esperado: se muestra un mensaje de confirmación de guardado del idioma español
    await test.step('Seleccionar un nuevo idioma predeterminado y guardar', async () => {
      await page.locator('#field-storeLanguage').click();
      await page.getByRole('option', { name: /spanish|español/i }).click();
      await page.getByRole('button', { name: 'Save Settings' }).click();
      await expect(page.getByText('Saved successfully!')).toBeVisible();
    });

    await test.step('Abrir la tienda en una sesión nueva', async () => {
      const sesionNueva = await browser.newContext({ baseURL: process.env.BASE_URL });
      const tienda = await sesionNueva.newPage();
      await tienda.goto('/');

      // Resultado esperado: la tienda se muestra en el nuevo idioma predeterminado
      await expect(tienda.locator('html')).toHaveAttribute('lang', 'es');
      await tienda.goto('/account/login');
      await expect(tienda.locator('body')).toContainText(/correo electrónico|contraseña|crear una cuenta/i);

      await sesionNueva.close();
    });
  });

  test.afterEach(async ({ page }) => {
    await page.goto('/admin/setting/store');
    await page.locator('#field-storeLanguage').click();
    await page.getByRole('option', { name: /^English/ }).click();
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Saved successfully!')).toBeVisible();
  });
});