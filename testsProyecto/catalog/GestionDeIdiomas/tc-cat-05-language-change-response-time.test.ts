import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-1 Gestión de idiomas de la tienda', () => {

    const TIEMPO_MAXIMO_MS = 5000;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-5 Tiempo de respuesta al cambiar el idioma de la tienda', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-5' });

    const selectorIdioma = page
      .getByRole('combobox', { name: /language|idioma/i })
      .or(page.getByRole('button', { name: /language|idioma|english|español/i }))
      .or(page.getByRole('link', { name: /english|español/i }));

    let inicio = 0;

    await test.step('Abrir el selector de idioma en la tienda', async () => {
      // Resultado esperado: se muestran los idiomas disponibles
      await expect(
        selectorIdioma.first(),
        'No se puede medir el tiempo de cambio de idioma: la tienda no tiene un control para cambiarlo'
      ).toBeVisible();
      await selectorIdioma.first().click();
      await expect(page.getByText(/español|spanish/i).first()).toBeVisible();
    });

    await test.step('Seleccionar un idioma distinto al actual e iniciar la medición del tiempo', async () => {
      // Resultado esperado: la solicitud de cambio de idioma se envía
      inicio = Date.now();
      await page.getByText(/español/i).first().click();
    });

    await test.step('Esperar a que la interfaz se muestre en el nuevo idioma y detener la medición', async () => {
      // Resultado esperado: la interfaz se muestra en el idioma seleccionado en 5 segundos o menos
      await page.waitForLoadState('load');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      expect(Date.now() - inicio, 'El cambio de idioma debe tardar 5 s o menos').toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });
  });
});