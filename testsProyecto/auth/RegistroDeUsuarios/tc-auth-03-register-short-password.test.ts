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

test('@ES-TC-41 Registro con contraseña de menos de 6 caracteres', async ({ page }) => {
  test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-41' });
  const email = correoNuevo();
  await test.step('Abrir el formulario de registro sin sesión iniciada', async () => {
    await abrirRegistro(page);
  });
  await test.step('Ingresar datos válidos y contraseña de 5 caracteres', async () => {
    await llenarRegistro(page, email, 'Ab123');
  });
  await test.step('Enviar el formulario y comprobar que la contraseña se rechaza', async () => {
    await enviarRegistro(page);
    await expect(page.getByRole('alert')).toContainText(/password must be at least 6 characters long/i);
    await expect(page).toHaveURL(/\/account\/register(?:[?#]|$)/);
  });
});
