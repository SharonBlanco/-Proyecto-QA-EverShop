import { test, expect } from '@playwright/test';

test('@ES-TC-58 - Cierre de sesión exitoso del administrador', async ({ page }) => {
  test.setTimeout(90000);
  process.loadEnvFile('.env.qa');

  // Iniciar sesión como administrador
  await page.goto('/admin/login');
  await page.getByPlaceholder('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Confirmar que se cargó el panel
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Account menu' }))
    .toBeVisible({ timeout: 15000 });

  // Cerrar sesión desde el menú
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  // Comprobar que se cerró la sesión
  await expect(page).toHaveURL(/\/admin\/login(?:[/?#]|$)/, {
    timeout: 15000
  });

  // Intentar acceder nuevamente al panel
  await page.goto('/admin');

  // Debe solicitar autenticación
  await expect(page).toHaveURL(/\/admin\/login(?:[/?#]|$)/, {
    timeout: 15000
  });
});
