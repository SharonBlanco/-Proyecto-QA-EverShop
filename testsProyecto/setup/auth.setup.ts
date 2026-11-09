import { test as setup, expect } from '@playwright/test';

// Se ejecuta antes de las pruebas (dependencies: ['setup'] en el config).
// Inicia sesión como administrador y guarda las cookies en playwright/.auth/admin.json.

setup('Sesión de administrador', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Si el login funcionó, EverShop sale de la página de login
  await expect(page).not.toHaveURL(/\/admin\/login/);
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

setup('Sesión de cliente', async ({ page }) => {
  await page.goto('/account/login');
  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/account\/login/);
  await page.context().storageState({ path: 'playwright/.auth/cliente.json' });
});