import { test, expect } from '@playwright/test';

test('@ES-TC-53 - Contraseña incorrecta del administrador', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/admin/login');

  await page.getByPlaceholder('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByPlaceholder('Password').fill('ClaveIncorrecta987!');

  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // El administrador no debe acceder al panel
  await expect(page).toHaveURL(/\/admin\/login/, {
    timeout: 15000
  });

  // Comprobar si aparece un mensaje de error
  await expect(page.getByText(/invalid|incorrect|wrong|error/i).first())
    .toBeVisible({ timeout: 15000 });
});
