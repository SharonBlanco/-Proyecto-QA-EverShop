import { test, expect, Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';


test.use({ storageState: 'playwright/.auth/cliente.json' });

const BASE = process.env.BASE_URL || 'http://localhost:3000'; ;
const ARCHIVO = path.join('translations', 'es', 'zz-pruebas.csv');
const PRODUCTO = process.env.PRODUCTO_URL || '/hogar/tazaceramicaazul';

// Reinicia EverShop: lo apaga, lo vuelve a arrancar y espera a que responda
// Reinicia EverShop: lo apaga, lo vuelve a arrancar y espera a que responda
async function reiniciarServidor() {
  // Apagar los procesos de EverShop (sin herramientas externas)
  for (const pid of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) {
    try {
      if (fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').includes('evershop/dist/bin/')) process.kill(Number(pid));
    } catch {}
  }
  await expect.poll(async () => (await fetch(BASE).catch(() => null))?.ok ?? false).toBe(false);

  spawn('npm', ['run', 'start'], { stdio: 'ignore' });
  await expect.poll(async () => (await fetch(BASE).catch(() => null))?.ok, { timeout: 120_000 }).toBe(true);
}

// Solo para preparar y restaurar la precondición (no es un paso del caso)
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

  // Precondición: Español como idioma predeterminado de la tienda
  test.beforeAll(async ({ browser }) => {
    await idiomaPredeterminado(browser, /spanish|español/i);
  });

  test('@ES-TC-19 Integración entre el diccionario de traducciones y la interfaz de la tienda', async ({ page, browser }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-19' });
    test.setTimeout(5 * 60_000); // los reinicios del servidor tardan

    const botonCarrito = page.getByRole('button', { name: /agregar a la bolsa|añadir al carrito|add to cart/i });
    const selectorIdioma = page
      .getByRole('combobox', { name: /language|idioma/i })
      .or(page.getByRole('button', { name: /language|idioma|english|español/i }))
      .or(page.getByRole('link', { name: /english|español/i }));

    await test.step('Crear un archivo de traducción en la carpeta del idioma español', async () => {
      if (fs.existsSync(ARCHIVO)) fs.rmSync(ARCHIVO);
      fs.writeFileSync(ARCHIVO, '"Add to cart","Agregar a la bolsa"\n');
      // Resultado esperado: el archivo queda guardado en la carpeta de traducciones del idioma español
      expect(fs.readFileSync(ARCHIVO, 'utf-8')).toContain('Agregar a la bolsa');
    });

    await test.step('Reiniciar el servidor de la tienda', async () => {
      // Resultado esperado: el servidor inicia sin errores
      await reiniciarServidor();
    });

    await test.step('Abrir el detalle de un producto en la tienda en español', async () => {
      await page.goto(PRODUCTO);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      // Resultado esperado: el botón muestra "Agregar a la bolsa"
      await expect(botonCarrito).toHaveText(/agregar a la bolsa/i);
    });

      await test.step('Cambiar el idioma de la tienda a English', async () => {
      await idiomaPredeterminado(browser, /^English/);
      await page.reload();
      // Resultado esperado: el botón muestra "Add to cart"
      await expect(botonCarrito).toHaveText(/add to cart/i);
    });

    await test.step('Eliminar el archivo de traducción creado y reiniciar el servidor', async () => {
      fs.rmSync(ARCHIVO, { force: true });
      await reiniciarServidor();
      await idiomaPredeterminado(browser, /spanish|español/i);
      await page.goto(PRODUCTO);
      // Resultado esperado: la tienda en español vuelve a mostrar la traducción original del botón
      await expect(botonCarrito).toHaveText(/añadir al carrito/i);
    });
  });

  // Limpieza: borrar el archivo si quedó, reiniciar y regresar la tienda a inglés
  test.afterAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(3 * 60_000);
    if (fs.existsSync(ARCHIVO)) {
      fs.rmSync(ARCHIVO);
      await reiniciarServidor();
    }
    await idiomaPredeterminado(browser, /^English/);
  });
});