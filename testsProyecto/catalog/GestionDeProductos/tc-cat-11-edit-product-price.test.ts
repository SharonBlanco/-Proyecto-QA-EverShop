import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('admin/products');
  });

  test('@ES-TC-11 Editar precio de un producto existente', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-11' });

    await test.step('Abrir el producto desde el listado de productos', async () => {
      // Resultado esperado: se muestra el formulario del producto
      await expect(page.getByText('Taza Cerámica Azul', { exact: true })).toBeVisible();
      await page.getByRole('link', { name: 'Taza Cerámica Azul' }).click();
            // Resultado esperado: se muestra el formulario con los datos actuales del producto
      await expect(page.getByText('Editing Taza Cerámica Azul', { exact: true })).toBeVisible();
      await expect(page.getByRole('spinbutton', { name: 'Price *' })).toHaveValue(/^15000(\.0+)?$/);
    });

    await test.step('Cambiar el precio y guardar', async () => {
     await page.getByRole('spinbutton', { name: 'Price *' }).click();
      await page.getByRole('spinbutton', { name: 'Price *' }).fill('20000');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Product updated successfully')).toBeVisible();

    });
    await test.step('Volver al listado de productos y abrir nuevamente el producto', async () => {
        // Resultado esperado: se ve reflejado la actualización del producto
     await page.goto('admin/products');
     await expect(page.getByText('Taza Cerámica Azul', { exact: true })).toBeVisible();
     await page.getByRole('link', { name: 'Taza Cerámica Azul' }).click();
          // Resultado esperado: el formulario muestra el precio actualizado
     await expect(page.getByRole('spinbutton', { name: 'Price *' })).toHaveValue(/^20000(\.0+)?$/);
      });
  });

  test.afterEach(async ({ page }) => {
    //Resultado esperado: Se devuelve el producto a su estado original
    await page.goto('admin/products');
    await expect(page.getByText('Taza Cerámica Azul', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Taza Cerámica Azul' }).click();
    await page.getByRole('spinbutton', { name: 'Price *' }).click();
    await page.getByRole('spinbutton', { name: 'Price *' }).fill('15000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByLabel('Notifications alt+T').locator('ol')).toContainText('Product updated successfully');
  });
});