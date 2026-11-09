import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {

const PRODUCTO = 'Producto Prueba Eliminar';

test.beforeEach(async ({ page }) => {
  await page.goto('/admin/products');

  // Precondición: existe un producto de prueba publicado.
  // Si no existe, se crea por la API (aquí no se está probando la creación)
  if ((await page.getByRole('row', { name: PRODUCTO }).count()) === 0) {
    const id = Date.now();
    const res = await page.request.post('/api/products', {
      data: {
        name: PRODUCTO,
        url_key: `producto-prueba-eliminar-${id}`,
        sku: `QA-ELIM-${id}`,
        price: 10000,
        qty: 10,
        status: 1,
        visibility: 1,
        group_id: 1,
        no_shipping_required: true,
      },
    });
    expect(res.ok(), `No se pudo crear el producto de prueba: ${await res.text()}`).toBe(true);
    await page.reload();
  }
});

  test('@ES-TC-12 Eliminar un producto', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-12' });

    await test.step('Seleccionar el producto en el listado y elegir eliminar', async () => {
      // Resultado esperado: se muestra el formulario del producto
      await expect(page.getByText('Producto Prueba Eliminar', { exact: true })).toBeVisible();
      
      await page.getByRole('row', { name: 'Producto Prueba Eliminar' }).getByRole('checkbox').click();
      await page.getByRole('button', { name: 'Delete' }).click();
      await page.getByText('Delete').nth(2).click();
      
    });

    await test.step('Confirmar la eliminación', async () => {
        await expect(page.getByText('Product deleted successfully')).toBeVisible();
    });

    await test.step('Buscar el producto en el listado de productos del panel', async () => {
      await page.goto('/admin/products');
      // Resultado esperado: el producto no aparece en el listado
      await expect(page.getByRole('row', { name: PRODUCTO })).toHaveCount(0);
    });
  });

});