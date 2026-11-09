import { test, expect, Page } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

// Datos de prueba del caso ES-TC-18
const TERMINO = 'taza';
const CATEGORIA = /hogar/i;
const PRECIO_MIN = 10000;
const PRECIO_MAX = 20000;
const TIEMPO_MAXIMO_MS = 3000;

// Productos que se muestran en los resultados (nombre y precio)
async function resultados(page: Page) {
  return (await page.locator('a:has(h3)').allTextContents()).map((t) => ({
    texto: t,
    precio: Number((t.match(/\$([\d,]+)\./) || [])[1]?.replace(/,/g, '')),
  }));
}
test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@ES-TC-18 Tiempo de respuesta al aplicar filtros sobre una búsqueda', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-18' });
    let inicio = 0;

    await test.step('Ingresar "taza" en la barra de búsqueda y ejecutar la búsqueda', async () => {
      await page.getByRole('link', { name: 'Search' }).click();
      await page.getByRole('textbox', { name: 'Search' }).fill(TERMINO);
      await page.getByRole('textbox', { name: 'Search' }).press('Enter');
      // Resultado esperado: se muestran los productos que coinciden con "taza"
      await expect(page.getByRole('heading', { level: 3, name: /taza/i }).first()).toBeVisible();
    });

    await test.step('Seleccionar una categoría en los filtros e iniciar la medición del tiempo', async () => {
      const filtroCategoria = page.getByRole('checkbox', { name: CATEGORIA })
        .or(page.getByRole('radio', { name: CATEGORIA }))
        .or(page.getByRole('option', { name: CATEGORIA }))
        .or(page.getByRole('link', { name: CATEGORIA }));
      await expect(
        filtroCategoria.first(),
        'Los resultados de búsqueda deberían ofrecer un filtro por categoría (REQ-CAT-003)'
      ).toBeVisible();

      await page.evaluate(() => ((window as any).sinRecargar = true));
      const solicitud = page.waitForRequest(() => true);
      inicio = Date.now();
      await filtroCategoria.first().click();
      // Resultado esperado: la solicitud de filtrado se envía
      await solicitud;
    });

    await test.step('Esperar a que se actualicen los resultados y detener la medición', async () => {
      await page.waitForLoadState('networkidle');
      const tiempo = Date.now() - inicio;
      // Resultado esperado: solo productos de la categoría en 3 segundos o menos, sin recargar toda la página
      expect(await page.evaluate(() => (window as any).sinRecargar), 'La página no debe recargarse completa').toBe(true);
      expect(tiempo, `El filtro tardó ${tiempo} ms; debe tardar 3 s o menos`).toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });

    await test.step('Definir el rango de precio de 10000 a 20000 e iniciar la medición del tiempo', async () => {
      const minimo = page.getByRole('spinbutton', { name: /min|desde|from/i });
      const maximo = page.getByRole('spinbutton', { name: /max|hasta|to/i });
      await expect(minimo, 'Los resultados de búsqueda deberían ofrecer un filtro por rango de precio (REQ-CAT-003)').toBeVisible();

      const solicitud = page.waitForRequest(() => true);
      inicio = Date.now();
      await minimo.fill(String(PRECIO_MIN));
      await maximo.fill(String(PRECIO_MAX));
      await maximo.press('Enter');
      // Resultado esperado: la solicitud de filtrado se envía
      await solicitud;
    });

    await test.step('Esperar a que se actualicen los resultados y detener la medición', async () => {
      await page.waitForLoadState('networkidle');
      const tiempo = Date.now() - inicio;
      // Resultado esperado: solo productos de la categoría y el rango seleccionados en 3 segundos o menos
      for (const p of await resultados(page)) {
        expect.soft(p.precio, `"${p.texto}" está fuera del rango`).toBeGreaterThanOrEqual(PRECIO_MIN);
        expect.soft(p.precio, `"${p.texto}" está fuera del rango`).toBeLessThanOrEqual(PRECIO_MAX);
      }
      expect(tiempo, `El filtro tardó ${tiempo} ms; debe tardar 3 s o menos`).toBeLessThanOrEqual(TIEMPO_MAXIMO_MS);
    });
  });
});