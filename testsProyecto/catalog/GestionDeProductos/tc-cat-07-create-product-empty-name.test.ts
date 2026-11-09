import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('admin/products/new');
  });

  test('@ES-TC-7 Crear producto sin nombre', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-7' });

    await test.step('Acceder al formulario de nuevo producto', async () => {
      // Resultado esperado: se muestra el formulario del producto
      await expect(page.getByText('Create a new product', { exact: true })).toBeVisible();
    });

    await test.step('Completar descripción, precio, variante, marca, inventario, categoría y estado, dejando el nombre vacío', async () => {
     

    
     await page.locator('.ce-paragraph').click();
     await page.locator('.ce-paragraph').fill('Taza de cerámica de 350 ml');
     await page.getByRole('spinbutton', { name: 'Price *' }).click();
     await page.getByRole('spinbutton', { name: 'Price *' }).fill('15000');
     await page.getByRole('combobox', { name: 'Color' }).click();
     await page.getByText('Blue').click();
    // Marca: EverShop no tiene un campo de marca en el formulario de producto.
    // No afecta el objetivo de este caso (validar el nombre obligatorio).
    // La ausencia del campo se documenta como diferencia con REQ-CAT-002.
    // await page.getByRole('textbox', { name: 'Brand' }).fill('Artesanías Tico');
     await page.getByRole('spinbutton', { name: 'Quantity *' }).click();
     await page.getByRole('spinbutton', { name: 'Quantity *' }).fill('10');
     await page.getByRole('button', { name: 'Select category' }).click();
     await page.getByRole('button', { name: 'Select' }).first().click();
     await page.getByText('Enabled', { exact: true }).click();  

      // Resultado esperado: los campos aceptan los valores (y el nombre queda vacío)
     await expect(page.getByRole('textbox', { name: 'Product Name *' })).toHaveValue('');
     await expect(page.getByRole('spinbutton', { name: 'Price *' })).toHaveValue('15000');
      //await expect(      // Marca: EverShop no tiene un campo de marca en el formulario (ver ES-TC-6).page.getByRole('textbox', { name: 'Brand' })).toHaveValue('Artesanías Tico');
      await expect(page.getByRole('spinbutton', { name: 'Quantity *' })).toHaveValue('10');
     
    

    });
    await test.step('Guardar el producto', async () => {
      await page.getByRole('button', { name: 'Save' }).click();

      // Resultado esperado: el sistema no guarda el producto…
      await expect(page).toHaveURL(/\/admin\/products\/new/);
      await expect(page.getByText('Product created successfully')).toHaveCount(0);
      // …y muestra un mensaje indicando que el nombre es obligatorio
      await expect(page.getByText(/Product Name is required/i)).toBeVisible();
    });
  });
});