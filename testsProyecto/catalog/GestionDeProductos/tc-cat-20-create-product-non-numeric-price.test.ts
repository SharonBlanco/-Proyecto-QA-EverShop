import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('admin/products/new');
  });

  test('@ES-TC-20 Crear producto con precio no numérico', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-20' });

    await test.step('Completar todos los campos obligatorios con valores válidos, ingresando "abc$" en el campo precio', async () => {
      // Resultado esperado: se muestra el formulario del producto
      await expect(page.getByText('Create a new product', { exact: true })).toBeVisible();
    });

    await test.step('Completar nombre, descripción, precio, variante, marca, inventario, categoría y estado con valores válidos', async () => {
     
     await page.getByRole('textbox', { name: 'Product Name *' }).click();
     await page.getByRole('textbox', { name: 'Product Name *' }).fill('Taza Cerámica Azul');
     await page.locator('.ce-paragraph').click();
     await page.locator('.ce-paragraph').fill('Taza de cerámica de 350 ml');
     await page.getByRole('spinbutton', { name: 'Price *' }).click();
     await page.getByRole('spinbutton', { name: 'Price *' }).pressSequentially('abc$');
     await page.getByRole('combobox', { name: 'Color' }).click();
     await page.getByText('Blue').click();
     // Marca: EverShop no tiene un campo de marca en el formulario (ver ES-TC-6).
     //await page.getByRole('textbox', { name: 'Brand' }).fill('Artesanías Tico');
     await page.getByRole('spinbutton', { name: 'Quantity *' }).click();
     await page.getByRole('spinbutton', { name: 'Quantity *' }).fill('10');
     await page.getByRole('button', { name: 'Select category' }).click();
     await page.getByRole('button', { name: 'Select' }).first().click();
     await page.getByText('Enabled', { exact: true }).click();  


      await page.getByRole('textbox', { name: 'SKU *' }).fill('QA-TC20');
      await page.getByRole('textbox', { name: 'URL Key *' }).fill('qa-tc20-precio-no-numerico');
      await page.getByRole('textbox', { name: 'Meta Title *' }).fill('Taza Cerámica Azul');
      await page.getByRole('spinbutton', { name: 'Weight *' }).fill('0.5');
      await page.getByRole('combobox', { name: 'Tax Class *' }).click();
      await page.getByRole('option').first().click();
           // Resultado esperado: el campo no acepta el valor o muestra un mensaje de formato inválido
      await expect(page.getByRole('spinbutton', { name: 'Price *' })).toHaveValue('');
     
    });
    await test.step('Guardar el producto', async () => {
      await page.getByRole('button', { name: 'Save' }).click();
      // Resultado esperado: el sistema no guarda el producto
      await expect(page).toHaveURL(/\/admin\/products\/new/);
      await expect(page.getByText('Product created successfully')).toHaveCount(0);
      });
  });

    test.afterEach(async ({ page }) => {
    if (/\/admin\/products\/edit\//.test(page.url())) {
      await page.request.delete(`/api/products/${page.url().split('/').pop()}`);
    }
  });
});