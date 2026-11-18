import { test, expect } from '@playwright/test';

test('@ES-TC-59 - Bloquear páginas protegidas después del cierre de sesión', async ({ page }) => {
  test.setTimeout(90000);
  process.loadEnvFile('.env.qa');

  await page.goto('/account/login');
  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/account\/login/, {
    timeout: 20000
  });

  // Acceder a una página protegida
  await page.goto('/account/orders');
  await expect(page).toHaveURL(/\/account\/orders/);

  // Cerrar sesión
  await page.goto('/account');
  await page.getByRole('button', { name: 'Log out' }).click();

  // Esperar que finalice el cierre de sesión
  await expect(page).toHaveURL('http://localhost:3000/', {
    timeout: 15000
  });

  // Intentar entrar directamente a una página protegida
  await page.goto('/account/orders');

  // Debe solicitar autenticación
  await expect(page).toHaveURL(/\/account\/login/, {
    timeout: 15000
  });
});
