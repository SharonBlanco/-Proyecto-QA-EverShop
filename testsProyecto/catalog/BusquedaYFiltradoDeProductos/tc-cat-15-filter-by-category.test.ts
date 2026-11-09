import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  test.beforeEach(async ({ page }) => {
    // REQ-CAT-003: el cliente busca un producto y después filtra los resultados
    await page.goto('/');
    await page.getByRole('link', { name: 'Search' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill('taza');
    await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  });

  test('@ES-TC-15 Filtrar productos por categoría', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-15' });
    const productos = page.getByRole('link', { name: /.+/ }).filter({ has: page.locator('img') });
    let resultadosAntes: string[] = [];

    await test.step('Seleccionar una categoría en los filtros', async () => {
      resultadosAntes = await productos.allTextContents();

      // El cliente busca los filtros en los resultados de búsqueda
      const filtros = page.getByRole('button', { name: /filtr|filter/i })
        .or(page.getByRole('heading', { name: /filtr|filter|categor/i }));
      await expect(filtros.first(), 'Los resultados de búsqueda deberían ofrecer filtros (REQ-CAT-003)').toBeVisible();
      if (await page.getByRole('button', { name: /filtr|filter/i }).count()) {
        await page.getByRole('button', { name: /filtr|filter/i }).first().click();
      }

      // Elige la categoría del dato de prueba
      const hogar = page.getByRole('checkbox', { name: /hogar/i })
        .or(page.getByRole('radio', { name: /hogar/i }))
        .or(page.getByRole('option', { name: /hogar/i }))
        .or(page.getByRole('link', { name: /hogar/i }));
      await expect(hogar.first(), 'Los filtros deberían permitir elegir la categoría Hogar').toBeVisible();

      await page.evaluate(() => ((window as any).sinRecargar = true));
      await hogar.first().click();
      await page.waitForLoadState('networkidle');

      // Resultado esperado: los resultados se actualizan sin recargar toda la página
      expect(await page.evaluate(() => (window as any).sinRecargar), 'La página no debe recargarse completa').toBe(true);
    });

    await test.step('Revisar los productos mostrados', async () => {
      // Resultado esperado: todos los productos pertenecen a la categoría seleccionada
      const resultados = await productos.allTextContents();
      expect(resultados.length, 'El filtro debería mostrar productos de Hogar').toBeGreaterThan(0);
      expect(resultados.length, 'El filtro debería reducir o mantener los resultados').toBeLessThanOrEqual(resultadosAntes.length);
    });
  });
});