import { test, expect } from '@playwright/test';
import { TAZA, asegurarProducto, prepararCarrito, vaciarCarrito, irAlCheckoutDesdeCarrito, completarEnvio } from '../helpers/pedidos';

test.use({ storageState: 'playwright/.auth/cliente.json' });

test.describe('ES-6 Proceso de checkout', () => {
  test.beforeEach(async ({ page }) => {
    const { sku } = await asegurarProducto(TAZA);
    await prepararCarrito(page, [{ sku, qty: 1 }]);
  });

  test('@ES-TC-35 Checkout con la dirección exacta vacía', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-35' });

    await test.step('Abrir el carrito y continuar al checkout', async () => {
      await irAlCheckoutDesdeCarrito(page);
      // Resultado esperado: se muestra el formulario de checkout
      await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
    });

    await test.step('Completar nombre, teléfono, provincia, cantón y distrito, dejando vacía la dirección exacta', async () => {
      await completarEnvio(page, { direccion: undefined });
      // Resultado esperado: los campos aceptan los valores y la dirección exacta permanece vacía
      await expect(page.getByRole('textbox', { name: /full name/i })).toHaveValue('Ana Mora');
      await expect(page.getByRole('textbox', { name: /^address(?! 2)/i })).toHaveValue('');
    });

    await test.step('Intentar continuar con el proceso de checkout', async () => {
      // Se intenta avanzar eligiendo el método de envío y confirmando el pedido
      await page.getByRole('textbox', { name: /^address(?! 2)/i }).focus();
      await page.keyboard.press('Tab');
      await page.getByRole('radio').first().click({ force: true }).catch(() => {});
      // Resultado esperado: el sistema no avanza y muestra un mensaje indicando que la dirección exacta es obligatoria
      await expect(page.getByText(/address is required|address.*(required|obligatori)/i).first()).toBeVisible();
      await expect(page).not.toHaveURL(/\/checkout\/success/);
    });
  });

  test.afterEach(async ({ page }) => {
    await vaciarCarrito(page);
  });
});
