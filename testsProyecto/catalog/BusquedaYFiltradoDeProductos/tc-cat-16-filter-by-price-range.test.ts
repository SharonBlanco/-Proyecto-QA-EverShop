import { test, expect, Browser } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/cliente.json' });

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Datos de prueba del caso ES-TC-16
const PRECIO_MIN = 10000;
const PRECIO_MAX = 15000;
const PRECIOS_REFERENCIA = [9999, 10000, 10001, 12500, 14999, 15000, 15001];
const DEBEN_APARECER = [10000, 10001, 12500, 14999, 15000];
const NO_DEBEN_APARECER = [9999, 15001];

// Lo que crea el test, para borrarlo al final
const id = Date.now();
let categoria: { uuid: string; url: string } | undefined;
const productosCreados: string[] = [];

// Sesión de administrador solo para preparar y limpiar (no es un paso del caso)
async function comoAdmin(browser: Browser) {
  const ctx = await browser.newContext({ baseURL: BASE, storageState: 'playwright/.auth/admin.json' });
  return { ctx, api: ctx.request };
}

test.describe('ES-3 Búsqueda y filtrado de productos', () => {

  // Precondición: existen productos publicados con precios de 9999, 10000, 10001, 12500, 14999, 15000 y 15001
  test.beforeAll(async ({ browser }) => {
    const { ctx, api } = await comoAdmin(browser);

    const resCat = await api.post('/api/categories', {
      data: { name: 'QA Rango Precios', url_key: `qa-rango-precios-${id}`, status: 1 },
    });
    expect(resCat.ok(), `No se pudo crear la categoría de prueba: ${await resCat.text()}`).toBe(true);
    const cat = (await resCat.json()).data;
    categoria = { uuid: cat.uuid, url: `/qa-rango-precios-${id}` };

    for (const precio of PRECIOS_REFERENCIA) {
      const res = await api.post('/api/products', {
        data: {
          name: `QA Precio ${precio}`,
          url_key: `qa-precio-${precio}-${id}`,
          sku: `QA-PRECIO-${precio}-${id}`,
          price: precio,
          qty: 10,
          status: 1,
          visibility: 1,
          group_id: 1,
          no_shipping_required: true,
          category_id: cat.category_id,
        },
      });
      expect(res.ok(), `No se pudo crear el producto de ${precio}: ${await res.text()}`).toBe(true);
      productosCreados.push((await res.json()).data.uuid);
    }
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(categoria!.url);
  });

  test('@ES-TC-16 Filtrar productos por rango de precio', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-16' });

    // Precios de los productos que se muestran en el listado
    const preciosMostrados = async () =>
      (await page.locator('a:has(h3)').allTextContents())
        .map((t) => Number((t.match(/\$([\d,]+)\./) || [])[1]?.replace(/,/g, '')))
        .filter((n) => !Number.isNaN(n));

    await test.step('Definir el rango de precio de 10000 a 15000', async () => {
      const minimo = page.getByRole('slider').first();
      const maximo = page.getByRole('slider').last();

      await page.evaluate(() => ((window as any).sinRecargar = true));
      await minimo.press('ArrowRight'); // 9999 → 10000
      await maximo.press('ArrowLeft');  // 15001 → 15000
      await expect(minimo).toHaveValue(String(PRECIO_MIN));
      await expect(maximo).toHaveValue(String(PRECIO_MAX));
      await page.waitForLoadState('networkidle');

      // Resultado esperado: los resultados se actualizan sin recargar toda la página
      await expect.poll(preciosMostrados).not.toContain(9999);
      expect(await page.evaluate(() => (window as any).sinRecargar), 'La página no debe recargarse completa').toBe(true);
    });

    await test.step('Revisar los productos mostrados', async () => {
      const precios = await preciosMostrados();

      // Resultado esperado: se muestran 10000, 10001, 12500, 14999 y 15000; no aparecen 9999 ni 15001
      for (const p of DEBEN_APARECER) {
        expect.soft(precios, `Debería mostrarse el producto de ${p}`).toContain(p);
      }
      for (const p of NO_DEBEN_APARECER) {
        expect.soft(precios, `No debería mostrarse el producto de ${p}`).not.toContain(p);
      }
    });
  });

  // Limpieza: borrar los productos y la categoría creados
  test.afterAll(async ({ browser }) => {
    const { ctx, api } = await comoAdmin(browser);
    for (const uuid of productosCreados) await api.delete(`/api/products/${uuid}`);
    if (categoria) await api.delete(`/api/categories/${categoria.uuid}`);
    await ctx.close();
  });
});