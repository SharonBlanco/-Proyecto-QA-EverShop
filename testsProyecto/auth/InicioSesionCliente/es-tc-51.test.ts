import { test, expect } from '@playwright/test';

test('@ES-TC-51 - Mantener sesión activa durante la navegación', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/account/login');

  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Confirmar el inicio de sesión
  await expect(page).not.toHaveURL(/\/account\/login/, {
    timeout: 20000
  });

  // Navegar a la página principal
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:3000/');

  // Regresar al área de cliente
  await page.goto('/account');

  // La sesión debe seguir activa
  await expect(page).not.toHaveURL(/\/account\/login/, {
    timeout: 15000
  });
});

