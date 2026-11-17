import { expect, request as pwRequest, type Page } from '@playwright/test';
import pg from 'pg';

// Utilidades compartidas por las pruebas del módulo de Compras y pedidos (ORD)

export const ADMIN_STATE = 'playwright/.auth/admin.json';
export const CLIENTE_STATE = 'playwright/.auth/cliente.json';

export type ProductoDatos = {
  nombre: string;
  sku: string;
  urlKey: string;
  precio: number;
  stock: number;
};

// Datos de prueba definidos en las precondiciones de los casos en QAtlas
export const TAZA: ProductoDatos = {
  nombre: 'Taza Cerámica Azul', sku: 'QA-ORD-TAZA', urlKey: 'taza-ceramica-azul', precio: 15000, stock: 10,
};
export const CHORREADOR: ProductoDatos = {
  nombre: 'Chorreador de Café', sku: 'QA-ORD-CHORREADOR', urlKey: 'chorreador-de-cafe', precio: 20000, stock: 10,
};
export const SIN_STOCK: ProductoDatos = {
  nombre: 'Producto Sin Stock', sku: 'QA-ORD-SINSTOCK', urlKey: 'producto-sin-stock', precio: 5000, stock: 0,
};
// "Camiseta Básica" tiene variantes y se crea una vez a mano desde el panel (URL Key: camiseta-basica).
// Variantes: White/SM (qa-camiseta-blanca), Black/XL (qa-camiseta-negra), Yellow/XXL (qa-camiseta-amarilla), stock 10 cada una.
export const CAMISETA_NOMBRE = 'Camiseta Básica';
export const CAMISETA_URL_KEY = process.env.CAMISETA_URL_KEY ?? 'camiseta-basica';


// Base de datos (misma conexión del .env que usa Sharon en tc-cat-08)

export async function consultarBD<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const cliente = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await cliente.connect();
  try {
    const { rows } = await cliente.query(sql, params);
    return rows;
  } finally {
    await cliente.end();
  }
}

async function buscarProducto(nombre: string) {
  return consultarBD<{ product_id: number; uuid: string; sku: string; url_key: string }>(
    `SELECT p.product_id, p.uuid, p.sku, pd.url_key
       FROM product p
       JOIN product_description pd ON pd.product_description_product_id = p.product_id
      WHERE pd.name = $1 LIMIT 1`,
    [nombre],
  );
}

/**
 * Deja el producto de referencia tal como lo exige la precondición del caso:
 * lo crea por la API de administración si no existe y fija su precio y stock.
 * No forma parte de lo que se prueba, por eso se hace por API/BD (convención del README).
 */
export async function asegurarProducto(p: ProductoDatos) {
  let filas = await buscarProducto(p.nombre);
  if (filas.length === 0) {
    // EverShop exige un paquete de envío para productos con envío: se usa el predeterminado
    const paquetes = await consultarBD<{ package_id: number }>(
      'SELECT package_id FROM "package" ORDER BY is_default DESC, package_id LIMIT 1',
    );
    expect(paquetes.length, 'Debe existir al menos un paquete de envío en la tienda').toBeGreaterThan(0);
    const admin = await pwRequest.newContext({ baseURL: process.env.BASE_URL, storageState: ADMIN_STATE });
    const res = await admin.post('/api/products', {
      data: {
        package_id: paquetes[0].package_id,
        name: p.nombre, sku: p.sku, url_key: p.urlKey, meta_title: p.nombre, price: p.precio,
        qty: p.stock, manage_stock: 1, stock_availability: p.stock > 0 ? 1 : 0,
        status: 1, visibility: 1, weight: 0.5, group_id: 1,
      },
    });
    expect(res.ok(), `No se pudo crear el producto "${p.nombre}": ${await res.text()}`).toBe(true);
    await admin.dispose();
    filas = await buscarProducto(p.nombre);
  }
  expect(filas.length, `El producto "${p.nombre}" debe existir (precondición del caso)`).toBe(1);
  const prod = filas[0];
  await consultarBD('UPDATE product SET price = $1, status = true WHERE product_id = $2', [p.precio, prod.product_id]);
  await consultarBD(
    'UPDATE product_inventory SET qty = $1, stock_availability = $2, manage_stock = true WHERE product_inventory_product_id = $3',
    [p.stock, p.stock > 0, prod.product_id],
  );
  return { productId: prod.product_id, uuid: prod.uuid, sku: prod.sku, urlKey: prod.url_key };
}


// Carrito (con la sesión del cliente, vía las mismas rutas que usa la tienda)

const CONSULTA_CARRITO = `query {
  myCart {
    uuid totalQty
    subTotal { value }
    grandTotal { value }
    items { cartItemId uuid removeApi productSku productName qty productPrice { value } lineTotal { value } }
  }
}`;

export async function obtenerCarrito(page: Page) {
  const res = await page.request.post('/api/graphql', { data: { query: CONSULTA_CARRITO } });
  expect(res.ok(), await res.text()).toBe(true);
  const json = await res.json();
  return json.data?.myCart ?? null;
}

export async function vaciarCarrito(page: Page) {
  const carrito = await obtenerCarrito(page);
  for (const item of carrito?.items ?? []) {
    // removeApi es la URL exacta que EverShop construye para borrar el ítem (usa el uuid, no el id numérico)
    const res = await page.request.delete(item.removeApi);
    expect(res.ok(), `No se pudo eliminar ${item.productName} del carrito: ${await res.text()}`).toBe(true);
  }
}

export async function agregarAlCarritoPorAPI(page: Page, sku: string, qty: number) {
  const res = await page.request.post('/api/cart/mine/items', { data: { sku, qty } });
  expect(res.ok(), `No se pudo agregar ${sku} al carrito: ${await res.text()}`).toBe(true);
}

/** Deja el carrito exactamente con los productos indicados (precondición de los casos). */
export async function prepararCarrito(page: Page, productos: { sku: string; qty: number }[]) {
  await vaciarCarrito(page);
  for (const p of productos) await agregarAlCarritoPorAPI(page, p.sku, p.qty);
}


// Interfaz
/** Indicador del carrito del encabezado: su aria-label es "Shopping cart with N items". */
export function indicadorCarrito(page: Page) {
  return page.locator('button[aria-label^="Shopping cart with"]').first();
}

export async function cantidadEnIndicador(page: Page): Promise<number> {
  const etiqueta = (await indicadorCarrito(page).getAttribute('aria-label')) ?? '';
  return Number(/with (\d+)/.exec(etiqueta)?.[1] ?? 0);
}

/** Regex tolerante al formato de moneda: 45000 -> 45000, 45,000, 45.000, 45 000 */
export function monto(valor: number): RegExp {
  const conSeparador = String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '[.,\\s]?');
  return new RegExp(`(^|\\D)${conSeparador}(\\D|$)`);
}

export async function abrirProducto(page: Page, urlKey: string) {
  await page.goto(`/${urlKey}`);
}

export async function agregarDesdeProducto(page: Page, cantidad: number) {
  await page.getByRole('spinbutton', { name: /quantity/i }).fill(String(cantidad));
  await page.getByRole('button', { name: 'Add to cart' }).click();
}

/** Cada fila del carrito tiene: botón (-), botón (+) y "Remove". */
export function filaCarrito(page: Page, nombre: string) {
  return page.locator('.cart__item').filter({ hasText: nombre });
}
/** Cantidad mostrada en una fila del carrito (el texto de la fila viene pegado, no sirve buscar \\b3\\b). */
export const cantidadFila = (fila: ReturnType<typeof filaCarrito>) => fila.locator('span.w-8');
export const botonMas = (fila: ReturnType<typeof filaCarrito>) => fila.locator('button').nth(1);
export const botonMenos = (fila: ReturnType<typeof filaCarrito>) => fila.locator('button').nth(0);

export function totalesCarrito(page: Page) {
  return {
    subtotal: page.getByText('Sub total', { exact: true }).first().locator('..'),
    total: page.locator('.grand-total').first(),
  };
}

/** Elige una opción en un campo que puede ser <select> nativo o un combobox personalizado. */
export async function elegirOpcion(page: Page, etiqueta: string | RegExp, texto: RegExp) {
  const campo = page.getByLabel(etiqueta).first();
  const esSelect = await campo.evaluate((el) => el.tagName === 'SELECT').catch(() => false);
  if (esSelect) {
    const valor = await campo.locator('option', { hasText: texto }).first().getAttribute('value');
    await campo.selectOption(valor ?? '');
    return;
  }
  await campo.click();
  await page.getByRole('option', { name: texto }).first().click();
}

// Datos de envío de los casos de checkout. EverShop NO tiene los campos cantón, distrito ni
// "dirección exacta"; se usan los equivalentes más cercanos (y se reporta como hallazgo):
//   cantón -> City, distrito -> Address 2, dirección exacta -> Address.
export const ENVIO = {
  nombre: 'Ana Mora', telefono: '88887777', provincia: 'San José', canton: 'San José',
  distrito: 'Carmen', codigoPostal: '10101', direccion: '100 metros norte de la iglesia',
};

export async function irAlCheckoutDesdeCarrito(page: Page) {
  await page.goto('/cart');
  await page.getByRole('button', { name: /proceed to checkout/i }).click();
  await page.waitForURL(/\/checkout/);
}

export async function completarEnvio(page: Page, datos: { direccion?: string } = {}) {
  const direccion = 'direccion' in datos ? datos.direccion : ENVIO.direccion;
  await page.getByRole('textbox', { name: /full name/i }).fill(ENVIO.nombre);
  await page.getByRole('textbox', { name: /telephone/i }).fill(ENVIO.telefono);
  await elegirOpcion(page, /country/i, /costa rica/i);
  await elegirOpcion(page, /province/i, /san jos/i);
  await page.getByRole('textbox', { name: /^city/i }).fill(ENVIO.canton);
  await page.getByRole('textbox', { name: /address 2/i }).fill(ENVIO.distrito);
  await page.getByRole('textbox', { name: /postcode/i }).fill(ENVIO.codigoPostal);
  if (direccion) await page.getByRole('textbox', { name: /^address(?! 2)/i }).fill(direccion);
}

/** Texto de los avisos y errores visibles en pantalla (para diagnosticar fallos del checkout). */
async function avisosVisibles(page: Page): Promise<string> {
  const textos = await page
    .locator('[data-sonner-toast], [role="alert"], .text-destructive')
    .allInnerTexts()
    .catch(() => [] as string[]);
  return textos.map((t) => t.trim()).filter(Boolean).join(' | ') || '(sin avisos visibles)';
}

/** Genera un pedido real con pago contra entrega, recorriendo el checkout como lo haría el cliente. */
export async function hacerPedidoPorUI(page: Page, sku: string, qty: number) {
  await prepararCarrito(page, [{ sku, qty }]);
  await irAlCheckoutDesdeCarrito(page);
  await completarEnvio(page);

  // 1) Método de envío: esperar a que cargue y elegir el primero
  const envio = page.locator('.checkout-shipment').getByRole('radio').first();
  await envio.waitFor({ state: 'attached', timeout: 15_000 }).catch(async () => {
    throw new Error(`No aparecieron métodos de envío (revisar la zona de envío de Costa Rica en el admin). Avisos: ${await avisosVisibles(page)}`);
  });
  // El radio de EverShop es un <span role="radio">: se usa clic normal y se verifica aria-checked
  await envio.click();
  await expect(envio, `El método de envío no quedó seleccionado. Avisos: ${await avisosVisibles(page)}`).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });

  // 2) Método de pago: contra entrega
  const pago = page.getByText(/cash on delivery/i).first();
  await expect(pago, `No apareció el método de pago contra entrega. Avisos: ${await avisosVisibles(page)}`).toBeVisible({ timeout: 15_000 });
  await pago.click();

  // 3) Confirmar el pedido (el botón de contra entrega dice "Place Order")
  const confirmar = page.getByRole('button', { name: /place order|complete order/i });
  await expect(confirmar, `El botón de confirmar no está disponible. Avisos: ${await avisosVisibles(page)}`).toBeEnabled({ timeout: 15_000 });
  await confirmar.click();

  try {
    await page.waitForURL(/\/checkout\/success/, { timeout: 20_000 });
  } catch {
    throw new Error(`El pedido no llegó a la página de éxito (URL: ${page.url()}). Avisos en pantalla: ${await avisosVisibles(page)}`);
  }
}

export async function contarPedidosDelCliente(email: string): Promise<number> {
  const filas = await consultarBD(
    `SELECT count(*)::int AS n FROM "order" o JOIN customer c ON c.customer_id = o.customer_id WHERE c.email = $1`,
    [email],
  );
  return filas[0].n;
}