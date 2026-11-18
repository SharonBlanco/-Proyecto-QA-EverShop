import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Cada caso inicia sin sesión, aunque el proyecto tenga un setup global.
test.use({ storageState: { cookies: [], origins: [] } });

const correoNuevo = () => `qa-reg-${randomUUID()}@example.com`;

async function abrirRegistro(page: import('@playwright/test').Page) {
  await page.goto('/account/register');
  await expect(page.getByPlaceholder('Full Name')).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
}

async function llenarRegistro(page: import('@playwright/test').Page, email: string, password: string) {
  await page.getByPlaceholder('Full Name').fill('QA Registro');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
}

async function enviarRegistro(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /^sign up$/i }).click();
}

async function comprobarCuentaCreada(page: import('@playwright/test').Page) {
  // Tras el registro, EverShop inicia sesión automáticamente y redirige al inicio.
  await expect(page).not.toHaveURL(/\/account\/register(?:[?#]|$)/, { timeout: 90000 });
  await page.goto('/account');
  await expect(page).not.toHaveURL(/\/account\/login(?:[?#]|$)/);
  await expect(page).toHaveURL(/\/account(?:[/?#]|$)/);
}

test('@ES-TC-43 Registro con contraseña de exactamente 6 caracteres', async ({ page }) => {
  test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-43' });
  const email = correoNuevo();
  await test.step('Abrir el formulario de registro sin sesión iniciada', async () => {
    await abrirRegistro(page);
  });
  await test.step('Ingresar datos válidos y contraseña de exactamente 6 caracteres', async () => {
    await llenarRegistro(page, email, 'Ab1234');
  });
  await test.step('Enviar el formulario y comprobar el registro exitoso', async () => {
    await enviarRegistro(page);
    await comprobarCuentaCreada(page);
  });
});
