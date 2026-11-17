import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, irAlCheckoutDesdeCarrito, completarEnvio, monto } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-6 Proceso de checkout', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 2 }]);
  });

  test('@ES-TC-34 Completar el checkout con datos válidos', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-34' });

    await test.step('Abrir el carrito y continuar al checkout', async () => {
      await irAlCheckoutDesdeCarrito(page);
      // Resultado esperado: se muestra el formulario de checkout que solicita los datos de contacto y la dirección de envío
      await expect(page.getByRole('heading', { name: /checkout/i }).first()).toBeVisible();
      await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /telephone/i })).toBeVisible();
    });

    await test.step('Completar nombre, teléfono, provincia, cantón, distrito y dirección exacta', async () => {
      // Resultado esperado: el formulario tiene los campos del caso (hallazgo ES-BUG-17/18: EverShop no tiene
      // "cantón", "distrito" ni "dirección exacta"; usa City, Address 2 y Address). Si faltan, el paso falla.
      for (const campo of [/cant[óo]n/i, /distrito/i, /direcci[óo]n exacta/i]) {
        await expect.soft(page.getByRole('textbox', { name: campo }), `No existe el campo ${campo}`).toHaveCount(1);
      }
      // Para poder continuar se llenan los campos equivalentes de EverShop (más el código postal que exige)
      await completarEnvio(page);
      // Resultado esperado: los campos aceptan los valores ingresados
      await expect(page.getByRole('textbox', { name: /full name/i })).toHaveValue('Ana Mora');
      await expect(page.getByRole('textbox', { name: /telephone/i })).toHaveValue('88887777');
      await expect(page.getByRole('textbox', { name: /^address(?! 2)/i })).toHaveValue('100 metros norte de la iglesia');
    });

    await test.step('Continuar con el proceso de checkout', async () => {
      // EverShop no tiene botón "Continuar": el avance es elegir el método de envío disponible
      await page.getByRole('radio').first().click({ force: true });
      // Resultado esperado: el sistema avanza sin mostrar errores
      await expect(page.locator('.text-destructive, [role="alert"]').filter({ hasText: /required|invalid|error/i })).toHaveCount(0);
    });

    await test.step('Revisar el resumen del pedido', async () => {
      const resumen = page.locator('.item__summary__list').first();
      // Resultado esperado: se muestran el producto, la cantidad 2, el subtotal de 30000, el costo de envío y el total
      await expect(resumen).toContainText(TAZA.nombre);
      await expect(resumen).toContainText(/^\s*2(?=\D)/); // el resumen muestra la cantidad antes del nombre
      await expect(page.getByText('Sub total', { exact: true }).first().locator('..')).toContainText(monto(30000));
      await expect(page.getByText(/^shipping/i).first()).toBeVisible();
      await expect(page.locator('.grand-total').first()).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
