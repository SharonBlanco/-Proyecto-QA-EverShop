import { test, expect } from '@playwright/test';

test('@ES-TC-50 - Inicio de sesión con campos vacíos', async ({ page }) => {
  await page.goto('/account/login');

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();

  await expect(page).toHaveURL(/\/account\/login/);
});

