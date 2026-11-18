import { test, expect } from '@playwright/test';

test('@ES-TC-55 - Impedir acceso al panel sin autenticación', async ({ page }) => {
  // Abrir el panel sin iniciar sesión
  await page.goto('/admin');

  // Debe redirigir a la página de inicio de sesión
  await expect(page).toHaveURL(/\/admin\/login(?:[/?#]|$)/, {
    timeout: 15000
  });

  // Comprobar que aparece el formulario
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
});
