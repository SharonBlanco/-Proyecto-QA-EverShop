import { test, expect } from '@playwright/test';
import { consultarBD } from '../helpers/pedidos';

// Este caso necesita un cliente SIN pedidos: se registra uno nuevo y se borra al terminar.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('ES-7 Historial de pedidos del cliente', () => {
  const email = `qa.sinpedidos.${Date.now()}@test.com`;
  const clave = 'Qa-Sin-Pedidos-123!';

  test.beforeEach(async ({ page }) => {
    // Diagnóstico: se guarda lo que responde el servidor a las solicitudes POST del registro
    const respuestas: string[] = [];
    page.on('response', async (r) => {
      if (r.request().method() === 'POST') {
        const cuerpo = (await r.text().catch(() => '')).slice(0, 300);
        respuestas.push(`${r.status()} ${r.url()} ${cuerpo}`);
      }
    });

    await page.goto('/account/register', { waitUntil: 'networkidle' });
    await page.getByRole('textbox', { name: /full name/i }).fill('Cliente Sin Pedidos');
    await page.getByRole('textbox', { name: /email/i }).fill(email);
    await page.getByPlaceholder('Password').fill(clave);
    try {
      // Si el clic no produjo navegación, se reintenta
      await expect(async () => {
        if (/\/account\/register/.test(page.url())) {
          await page.getByRole('button', { name: /sign up/i }).click();
        }
        await expect(page).not.toHaveURL(/\/account\/register/, { timeout: 6_000 });
      }).toPass({ timeout: 20_000 });
    } catch {
      const avisos = (await page.locator('[data-sonner-toast], [role="alert"], .text-destructive').allInnerTexts().catch(() => []))
        .map((a) => a.trim()).filter(Boolean).join(' | ');
      throw new Error(`El registro no avanzó. Avisos en pantalla: ${avisos || '(ninguno)'}. Respuestas POST: ${respuestas.join(' || ') || '(ninguna)'}`);
    }
    // Si el registro no inicia sesión solo, se inicia manualmente
    if (/\/account\/login/.test(page.url())) {
      await page.getByPlaceholder('Email').fill(email);
      await page.getByPlaceholder('Password').fill(clave);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL((u) => !/\/account\/login/.test(u.pathname));
    }
  });

  test('@ES-TC-42 Historial de pedidos sin pedidos realizados', async ({ page }) => {
    test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-42' });

    await test.step('Acceder a la sección de pedidos desde la cuenta del cliente', async () => {
      await page.goto('/account/orders');
      // Resultado esperado: se muestra la sección de pedidos
      await expect(page.getByRole('heading', { name: /orders/i }).first()).toBeVisible();
    });

    await test.step('Revisar el contenido de la sección', async () => {
      // Resultado esperado: se muestra un mensaje indicando que el cliente no tiene pedidos
      await expect(page.getByText(/you have not placed any orders yet/i)).toBeVisible();
    });
  });

  test.afterEach(async () => {
    await consultarBD('DELETE FROM customer WHERE email = $1', [email]);
  });
});