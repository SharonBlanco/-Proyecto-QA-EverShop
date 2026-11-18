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

test('@ES-TC-39 Registro con correo electrónico duplicado', async ({ page }) => {
  test.info().annotations.push({ type: 'qatlas', description: 'ES-TC-39' });
  // Debe existir una cuenta cliente con este correo en la base de datos de prueba.
  const emailExistente = process.env.CLIENTE_EMAIL;
  test.skip(!emailExistente, 'Configura CLIENTE_EMAIL con un cliente ya registrado.');
  await test.step('Abrir el formulario de registro sin sesión iniciada', async () => {
    await abrirRegistro(page);
  });
  await test.step('Introducir un correo electrónico ya registrado', async () => {
    await llenarRegistro(page, emailExistente!, 'Qa123456!');
  });
  await test.step('Intentar registrar la cuenta y comprobar el rechazo', async () => {
    await enviarRegistro(page);
    await expect(page.getByText('Email is already used', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/account\/register(?:[?#]|$)/);
  });
});
