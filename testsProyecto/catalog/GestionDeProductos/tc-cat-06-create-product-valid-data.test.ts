import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {
    let uuidCreado: string | undefined;

  test.beforeEach(async ({ page }) => {
    await page.goto('admin/products/new');
  });

  test('@ES-TC-6 Crear producto con datos válidos', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-6' });

    await test.step('Acceder al formulario de nuevo producto', async () => {
      // Resultado esperado: se muestra el formulario del producto
      await expect(page.getByText('Create a new product', { exact: true })).toBeVisible();
    });

    await test.step('Completar nombre, descripción, precio, variante, marca, inventario, categoría y estado con valores válidos', async () => {
     
     await page.getByRole('textbox', { name: 'Product Name *' }).click();
     await page.getByRole('textbox', { name: 'Product Name *' }).fill('Taza Cerámica Azul');
     await page.locator('.ce-paragraph').click();
     await page.locator('.ce-paragraph').fill('Taza de cerámica de 350 ml');
     await page.getByRole('spinbutton', { name: 'Price *' }).click();
     await page.getByRole('spinbutton', { name: 'Price *' }).fill('15000');
     await page.getByRole('combobox', { name: 'Color' }).click();
     await page.getByText('Blue').click();
     await page.getByRole('textbox', { name: 'Brand' }).fill('Artesanías Tico');
     await page.getByRole('spinbutton', { name: 'Quantity *' }).click();
     await page.getByRole('spinbutton', { name: 'Quantity *' }).fill('10');
     await page.getByRole('button', { name: 'Select category' }).click();
     await page.getByRole('button', { name: 'Select' }).first().click();
     await page.getByText('Enabled', { exact: true }).click();  

      // Resultado esperado: los campos aceptan los valores ingresados
      await expect(page.getByRole('textbox', { name: 'Product Name *' })).toHaveValue('Taza Cerámica Azul');
      await expect(page.getByRole('spinbutton', { name: 'Price *' })).toHaveValue('15000');
      await expect(page.getByRole('textbox', { name: 'Brand' })).toHaveValue('Artesanías Tico');
      await expect(page.getByRole('spinbutton', { name: 'Quantity *' })).toHaveValue('10');
   
    

    });
    await test.step('Guardar el producto', async () => {
        // Resultado esperado: se muestra el mensaje de confirmación de guardado
    await page.getByRole('button', { name: 'Save' }).click();
     await expect(page.getByLabel('Notifications alt+T').locator('ol')).toContainText('Product created successfully');
       // …y el producto aparece en el listado
      await page.waitForURL(/\/admin\/products\/edit\//);
      uuidCreado = page.url().split('/').pop();
      await page.goto('/admin/products');
      await expect(page.locator(`a[href*="${uuidCreado}"]`)).toBeVisible();
      });
  });
    // Limpieza: borrar solo el producto que creó este test (no la taza que ya existía)
  test.afterEach(async ({ page }) => {
    if (uuidCreado) {
      await page.request.delete(`/api/products/${uuidCreado}`);
      uuidCreado = undefined;
    }
  });
});