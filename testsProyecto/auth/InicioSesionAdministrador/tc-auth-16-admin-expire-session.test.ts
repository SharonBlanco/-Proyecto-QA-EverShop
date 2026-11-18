import { test, expect } from '@playwright/test';

test('@ES-TC-56 - Expiración de sesión administrativa por inactividad', async ({ page }) => {
  test.setTimeout(90000);
  process.loadEnvFile('.env.qa');

  await page.goto('/admin/login');

  await page.getByPlaceholder('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Confirmar que se inició sesión
  await expect(page).not.toHaveURL(/\/admin\/login/, {
    timeout: 20000
  });

  console.log('Sesión iniciada correctamente');
  console.log('Cookies:', (await page.context().cookies()).map(c => ({name:c.name, expires:c.expires, maxAgeRestanteSegundos: c.expires > 0 ? Math.round(c.expires - Date.now()/1000) : null})));

  // Mantener inactivo el navegador durante 20 segundos
  await page.waitForTimeout(20000);

  // Intentar acceder nuevamente a una página protegida
  await page.goto('/admin');

  // Comprobar si la sesión ha expirado
  await expect(page).toHaveURL(/\/admin\/login/, {
    timeout: 15000
  });
});

