import { test, expect } from '@playwright/test';

test('@ES-TC-60 - Verificar botón Atrás después de cerrar sesión', async ({ page }) => {
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
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'My account' }))
    .toBeVisible();

  // Cerrar sesión
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('http://localhost:3000/', {
    timeout: 15000
  });

  // Utilizar el botón Atrás del navegador
  await page.goBack({ waitUntil: 'domcontentloaded' });

  // Verificar que no se recupera una sesión válida
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account\/login/, {
    timeout: 15000
  });
});
