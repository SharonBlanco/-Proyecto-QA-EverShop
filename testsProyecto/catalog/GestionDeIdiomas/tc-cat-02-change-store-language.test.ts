import { test, expect, Browser } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Solo para preparar y restaurar el idioma inicial (no es un paso del caso)
async function idiomaPredeterminado(browser: Browser, idioma: RegExp) {
  const admin = await browser.newContext({ baseURL: BASE, storageState: 'playwright/.auth/admin.json' });
  const p = await admin.newPage();
  await p.goto('/admin/setting/store');
  await p.locator('#field-storeLanguage').click();
  await p.getByRole('option', { name: idioma }).click();
  await p.getByRole('button', { name: 'Save Settings' }).click();
  await expect(p.getByText('Saved successfully!')).toBeVisible();
  await admin.close();
}

test.describe('ES-1 Gestión de idiomas de la tienda', () => {

  // Dato de prueba del paso 1: la tienda está en Español
  test.beforeAll(async ({ browser }) => {
    await idiomaPredeterminado(browser, /spanish|español/i);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-2 Cambiar idioma de la tienda desde la interfaz', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-2' });

    const selectorIdioma = page
      .getByRole('combobox', { name: /language|idioma/i })
      .or(page.getByRole('button', { name: /language|idioma|english|español/i }))
      .or(page.getByRole('link', { name: /english|español/i }));

    await test.step('Abrir el selector de idioma en la tienda', async () => {
      await expect(
        selectorIdioma.first(),
        'La tienda debería mostrar un control para cambiar el idioma'
      ).toBeVisible();
      await selectorIdioma.first().click();
      // Resultado esperado: se muestran los idiomas disponibles
      await expect(page.getByText(/english/i).first()).toBeVisible();
    });

    await test.step('Seleccionar un idioma distinto al actual', async () => {
      await page.getByText(/english/i).first().click();
      // Resultado esperado: menús, botones y textos en el idioma seleccionado (English)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.goto('/account/login');
      await expect(page.locator('body')).toContainText(/email|password|create an account/i);
    });
  });

  // Limpieza: regresar la tienda a inglés
  test.afterAll(async ({ browser }) => {
    await idiomaPredeterminado(browser, /^English/);
  });
});