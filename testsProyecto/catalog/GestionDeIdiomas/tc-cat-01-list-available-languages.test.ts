import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-1 Gestión de idiomas de la tienda', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/setting/store');
  });

  test('@ES-TC-1 Visualizar lista de idiomas disponibles', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-1' });

    await test.step('Acceder a la sección de configuración de idiomas', async () => {
      // Resultado esperado: se muestra la pantalla de configuración de idiomas
      await expect(page.getByText('Languages', { exact: true })).toBeVisible();
      await expect(page.locator('#field-storeLanguage')).toBeVisible();
    });

    await test.step('Revisar el listado de idiomas', async () => {
      await page.locator('#field-storeLanguage').click();
      const opciones = page.getByRole('listbox').getByRole('option');

      // Resultado esperado: se muestra la lista de idiomas configurados, con Español e English
      await expect.soft(opciones.filter({ hasText: /english/i })).toHaveCount(1);
      await expect.soft(opciones.filter({ hasText: /spanish|español/i })).toHaveCount(1);
      await expect.soft(opciones, 'Solo deberían aparecer los idiomas configurados (Español e English)').toHaveCount(2);
    });
  });
});