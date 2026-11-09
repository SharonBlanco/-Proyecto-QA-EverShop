import { test, expect} from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-3 Búsqueda y filtrado de productos', () => {


    const TIEMPO_MAXIMO_MS = 5000;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-10 Tiempo de respuesta de la búsqueda de productos', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-10' });


    let inicio = 0;

   await test.step('Ingresar "taza" en la barra de búsqueda', async () => {
      await page.getByRole('link', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).pressSequentially('taza');
      // Resultado esperado: el término se muestra en la barra
      await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('taza');
    });

    await test.step('Ejecutar la búsqueda e iniciar la medición del tiempo', async () => {
      inicio = Date.now();
      await page.keyboard.press('Enter');
      
      // Resultado esperado: el sistema muestra el producto
      
      await expect(page.getByRole('heading', { name: 'Taza Cerámica Azul', exact: true })).toBeVisible();

    });

    await test.step('Esperar a que se carguen los resultados y detener la medición', async () => {
        await page.waitForLoadState('load');
      
      // Resultado esperado: el sistema muestra el producto
      
      await expect(page.getByRole('heading', { level: 3, name: /taza/i }).first()).toBeVisible();

      expect(Date.now() - inicio, 'La búsqueda debe tardar 5 s o menos').toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);

    });
  });

});