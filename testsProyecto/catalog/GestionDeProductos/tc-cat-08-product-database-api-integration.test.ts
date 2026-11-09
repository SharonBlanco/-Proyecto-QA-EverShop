import { test, expect } from '@playwright/test';
import pg from 'pg';

test.use({ storageState: 'playwright/.auth/admin.json' });

// Datos de prueba del caso ES-TC-8
const PRODUCTO = {
  nombre: 'Producto Integración 01',
  descripcion: 'Taza de cerámica de 350 ml',
  precio: 12000,
  color: /azul|blue/i,
  inventario: 5,
  categoria: 'Hogar',
};

// Consulta a la base de datos de EverShop (datos de conexión del .env)
async function consultarBD(nombre: string) {
  const cliente = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await cliente.connect();
  const { rows } = await cliente.query(
    `SELECT p.uuid, pd.name, p.price, pi.qty
       FROM product p
       JOIN product_description pd ON pd.product_description_product_id = p.product_id
       LEFT JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
       WHERE pd.name = $1 OR pd.url_key = 'producto-integracion-01' OR p.sku = 'QA-INT-01'`,
    [nombre]
  );
  await cliente.end();
  return rows;
}

test.describe('ES-2 Creación, eliminación y edición de un producto', () => {

  // Si quedó el producto de una corrida anterior, se borra para empezar limpio
  test.beforeEach(async ({ page }) => {
     for (const p of await consultarBD(PRODUCTO.nombre)) {
      const res = await page.request.delete(`/api/products/${p.uuid}`);
      expect(res.ok(), `No se pudo borrar el producto anterior: ${await res.text()}`).toBe(true);
    }
  });

  test('@ES-TC-8 Integración entre la creación de producto, la base de datos y la API', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-8' });
    let enBD: any;

    await test.step('Crear un producto completando nombre, descripción, precio, variante, marca, inventario, categoría y estado', async () => {
      await page.goto('/admin/products/new');
     await page.getByRole('textbox', { name: 'Product Name *' }).click();
     await page.getByRole('textbox', { name: 'Product Name *' }).fill('Producto Integración 01');
     await page.locator('.ce-paragraph').click();
     await page.locator('.ce-paragraph').fill('Taza de cerámica de 350 ml');
     await page.getByRole('spinbutton', { name: 'Price *' }).click();
     await page.getByRole('spinbutton', { name: 'Price *' }).fill('12000');
     await page.getByRole('combobox', { name: 'Color' }).click();
     await page.getByText('Blue').click();
     //Se elimina este paso debido a que lo quese prueba es la integración
     //await page.getByRole('textbox', { name: 'Brand' }).click();
     //await page.getByRole('spinbutton', { name: 'Brand' }).fill('Artesanías Tico');  
     await page.getByRole('spinbutton', { name: 'Quantity *' }).click();
     await page.getByRole('spinbutton', { name: 'Quantity *' }).fill('5');
     await page.getByRole('button', { name: 'Select category' }).click();
     await page.getByRole('button', { name: 'Select' }).first().click();
     await page.getByText('Enabled', { exact: true }).click();  
    // Marca: EverShop no tiene un campo de marca en el formulario de producto.
    // No afecta el objetivo de este caso (integración entre creación, BD y API). Ver ES-TC-6.
    // Campos que EverShop exige para guardar (no forman parte de los datos del caso)
    //await page.getByRole('textbox', { name: 'Brand' }).fill('Artesanías Tico');
     await page.getByRole('textbox', { name: 'SKU *' }).fill('QA-INT-01');
     await page.getByRole('textbox', { name: 'URL Key *' }).fill('producto-integracion-01');
     await page.getByRole('textbox', { name: 'Meta Title *' }).fill('Producto Integración 01');
     await page.getByRole('spinbutton', { name: 'Weight *' }).fill('0.5');
    
     await page.getByRole('combobox', { name: 'Tax Class *' }).click();
     await page.getByRole('option').first().click();
     await page.getByRole('button', { name: 'Save' }).click();
      // Resultado esperado: el sistema muestra un mensaje de confirmación
     await expect(page.getByLabel('Notifications alt+T').locator('ol')).toContainText('Product created successfully');
    });

    await test.step('Consultar la tabla de productos en la base de datos filtrando por el nombre del producto', async () => {
      const filas = await consultarBD(PRODUCTO.nombre);
      // Resultado esperado: existe un registro con el nombre, precio e inventario ingresados
      expect(filas, 'Debe existir exactamente un registro con ese nombre').toHaveLength(1);
      enBD = filas[0];
      expect(enBD.name).toBe(PRODUCTO.nombre);
      expect(Number(enBD.price)).toBe(PRODUCTO.precio);
      expect(enBD.qty).toBe(PRODUCTO.inventario);
    });

    await test.step('Consultar el producto mediante la API GraphQL', async () => {
      const res = await page.request.post('/api/admin/graphql', {
        data: {
          query: `query ($nombre: ID) {
            products(filters: [{ key: "keyword", operation: eq, value: $nombre }]) {
              items { name price { regular { value } } inventory { qty } }
            }
          }`,
          variables: { nombre: PRODUCTO.nombre },
        },
      });
      expect(res.ok(), await res.text()).toBe(true);
      const items = (await res.json()).data.products.items.filter((p: any) => p.name === PRODUCTO.nombre);

      // Resultado esperado: la API devuelve el producto con los mismos datos almacenados en la base de datos
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe(enBD.name);
      expect(items[0].price.regular.value).toBe(Number(enBD.price));
      expect(items[0].inventory.qty).toBe(enBD.qty);
    });
  });
    test.afterEach(async ({ page }) => {
    for (const p of await consultarBD(PRODUCTO.nombre)) {
      await page.request.delete(`/api/products/${p.uuid}`);
    }
  });
});