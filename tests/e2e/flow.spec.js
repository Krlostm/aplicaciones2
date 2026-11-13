import { test, expect } from '@playwright/test';
import pg from 'pg';
import { completeTutorOnboarding } from './helpers.js';
import dotenv from 'dotenv';
import { randomUUID, createHmac } from 'node:crypto';
dotenv.config({ path: new URL('../../backend/.env', import.meta.url), quiet: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const created = [];
test.afterAll(async () => {
  for (const email of created) {
    const identifier = createHmac('sha256', process.env.SESSION_SECRET)
      .update(`login:${email}`)
      .digest('hex');
    await pool.query('DELETE FROM auth_login_attempts WHERE identifier_hash=$1', [identifier]);
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (rows.length) {
      await pool.query("DELETE FROM auth_sessions WHERE sess::jsonb->>'userId'=$1", [rows[0].id]);
      await pool.query('DELETE FROM users WHERE id=$1', [rows[0].id]);
    }
  }
  await pool.end();
});
async function captureWorkspace(page, path) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
    style: '.skip-link:not(:focus){visibility:hidden;}',
  });
}
async function checkWorkspaceWidths(page) {
  const original = page.viewportSize();
  for (const width of [320, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  }
  await page.setViewportSize(original);
}
async function fillRegistration(page, email) {
  await page.getByLabel('Nombres', { exact: true }).fill('Lucía');
  await page.getByLabel('Apellidos', { exact: true }).fill('Prueba Navegador');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Universidad', { exact: true }).fill('ESPOCH');
  await page.getByLabel('Carrera', { exact: true }).fill('Ingeniería de Software');
  await page.getByLabel('Semestre', { exact: true }).selectOption('7');
  await page.getByLabel('Contraseña', { exact: true }).fill('Mi frase segura de navegador 2026');
  await page
    .getByLabel('Confirmar contraseña', { exact: true })
    .fill('Mi frase segura de navegador 2026');
  await page.getByRole('checkbox').check();
}
test('Portada muestra mascota y permite empezar, explorar y consultar privacidad', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('La universidad,');
  await expect(page.locator('.landing-mascot')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.landing-mascot').evaluate((e) => e.videoWidth || e.naturalWidth || 0),
    )
    .toBeGreaterThan(0);
  await expect(page.locator('.landing-story')).toHaveCount(4);
  await expect(
    page.getByRole('heading', { name: 'Enseña. Comparte. Genera ingresos.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.landing-page .lucide-arrow-up-right')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta.', exact: true })).toBeVisible();
  await expect(page.locator('.landing-subject-links a')).toHaveCount(4);
  await expect(page.locator('.landing-subject-links a').first()).toHaveAttribute(
    'href',
    '/dashboard?asignatura=C%C3%A1lculo',
  );
  await page.getByRole('link', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL('/registro');
  await page.goto('/');
  await page.getByRole('link', { name: 'Ya tengo una cuenta', exact: true }).click();
  await expect(page).toHaveURL('/iniciar-sesion');
  await page.goto('/');
  await page.locator('.landing-subject-links').getByRole('link', { name: 'Cálculo' }).click();
  await expect(page).toHaveURL('/iniciar-sesion');
  await page.goto('/');
  await page.getByRole('link', { name: 'Quiero ofrecer tutorías', exact: true }).click();
  await expect(page).toHaveURL('/iniciar-sesion');
  await page.goto('/');
  await page.getByRole('button', { name: 'Privacidad', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const illustration of await page.locator('.landing-story-art img').all()) {
    await illustration.scrollIntoViewIfNeeded();
    await expect
      .poll(() => illustration.evaluate((image) => image.naturalWidth))
      .toBeGreaterThan(0);
    await illustration.evaluate((image) => image.decode());
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => document.fonts.ready);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/portada-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test('La mascota se anima sin controles visibles y respeta movimiento reducido', async ({
  page,
}) => {
  await page.goto('/');
  const animation = page.locator('video.landing-mascot');
  await expect.poll(() => animation.evaluate((video) => video.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Pausar animación', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reproducir animación', exact: true })).toHaveCount(
    0,
  );
  await expect.poll(() => animation.evaluate((video) => video.paused)).toBe(false);
  await expect(page.locator('.subject-float')).toHaveCount(8);
  await expect(page.locator('.landing-hero .subject-float')).toHaveCount(0);
  await expect(page.locator('.subject-ornaments').first()).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.subject-ornaments').first()).toHaveCSS('pointer-events', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.subject-float').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('video.landing-mascot')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pausar animación' })).toHaveCount(0);
  await expect(page.locator('img.landing-mascot-still')).toBeVisible();
  await expect
    .poll(() => page.locator('img.landing-mascot-still').evaluate((image) => image.naturalWidth))
    .toBeGreaterThan(0);
  const motionDownloads = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/videos/llama-saludando.mp4')) motionDownloads.push(request.url());
  });
  await page.reload();
  await expect(page.locator('img.landing-mascot-still')).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
  expect(motionDownloads).toEqual([]);
});
test('Panel privado redirige al inicio de sesión', async ({ page }) => {
  for (const path of ['/dashboard', '/dashboard/tutor']) {
    await page.goto(path);
    await expect(page).toHaveURL(/iniciar-sesion/);
  }
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
});

test('Desplegables comparten selección naranja, teclado y cierre exterior', async ({ page }) => {
  await page.goto('/registro');
  const select = page.locator('.styled-select').filter({ has: page.locator('#semester') });
  const trigger = select.getByRole('combobox');
  await trigger.click();
  const option = select.getByRole('option', { name: '4.º semestre', exact: true });
  await option.hover();
  await expect(option).toHaveCSS('background-color', 'rgb(198, 80, 9)');
  await option.click();
  await expect(page.locator('#semester')).toHaveValue('4');
  await expect(trigger).toContainText('4.º semestre');
  await trigger.press('ArrowDown');
  await trigger.press('End');
  await trigger.press('Enter');
  await expect(page.locator('#semester')).toHaveValue('8');
  await trigger.click();
  await trigger.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.getByLabel('Nombres', { exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('Una cuenta completa su alta de tutor y cambia de modo desde la navegación', async ({
  page,
}, testInfo) => {
  const email = `tutor-e2e-${randomUUID()}@example.test`;
  created.push(email);
  await page.goto('/registro');
  await fillRegistration(page, email);
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Mi frase segura de navegador 2026');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Conviértete en tutor', exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/auth/me')).json()).user.isTutor).toBe(false);
  await expect(page.locator('.panel-switch,.dashboard-banner')).toHaveCount(0);
  const bio = 'Explico con ejemplos claros.\nMe gusta acompañar el aprendizaje paso a paso.';
  await page.goto('/dashboard/ser-tutor');
  await expect(page.getByRole('heading', { name: 'Empecemos por ti.' })).toBeVisible();
  await captureWorkspace(
    page,
    `docs/evidencias/interior-cuestionario-${testInfo.project.name}.png`,
  );
  await completeTutorOnboarding(page, { bio });
  if (testInfo.project.name === 'chromium') await checkWorkspaceWidths(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/interior-tutor-${testInfo.project.name}.png`,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  });
  await expect(page.getByRole('link', { name: 'Modo estudiante', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Mi perfil de tutor/ }).click();
  await expect(page.getByLabel('Tu especialidad', { exact: true })).toHaveValue(
    'Programación y matemáticas',
  );
  await expect(page.getByLabel('Presentación', { exact: true })).toHaveValue(bio);
  await page.getByLabel('Tu especialidad', { exact: true }).fill('Álgebra y programación');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('se guardaron correctamente');
  await page.reload();
  await expect(page.getByLabel('Tu especialidad', { exact: true })).toHaveValue(
    'Álgebra y programación',
  );
  const { rows } = await pool.query(
    `SELECT u.role,p.semester,t.headline FROM users u JOIN student_profiles p ON p.user_id=u.id JOIN tutor_profiles t ON t.user_id=u.id WHERE u.email=$1`,
    [email],
  );
  expect(rows[0]).toEqual({ role: 'student', semester: 7, headline: 'Álgebra y programación' });
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/tutor-${testInfo.project.name}.png`,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Modo estudiante', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.getByRole('button', { name: /LP/ }).click();
  await expect(page.locator('.user-menu')).toContainText(email);
  await page.locator('.user-menu').getByRole('link', { name: 'Modo tutor', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/tutor');
  await expect(
    page.getByRole('link', { name: 'Agregar una tutoría', exact: true }).first(),
  ).toBeVisible();
});

test('Ciudad y dirección del registro se conservan privadas entre ambos modos', async ({
  page,
}, testInfo) => {
  const email = `address-e2e-${randomUUID()}@example.test`;
  created.push(email);
  const address = 'Dirección ficticia 123, prueba automática';
  await page.goto('/registro');
  await fillRegistration(page, email);
  await page.getByLabel('Ciudad', { exact: true }).fill('Riobamba');
  await page.getByLabel('Dirección', { exact: true }).fill(address);
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Mi frase segura de navegador 2026');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/dashboard/cuenta');
  const form = page.getByRole('form', { name: 'Ciudad y dirección privadas' });
  await expect(form.getByLabel('Ciudad', { exact: true })).toHaveValue('Riobamba');
  await expect(form.getByLabel('Dirección', { exact: true })).toHaveValue(address);
  const { rows } = await pool.query(
    `SELECT c.city,c.address_ciphertext,c.address_iv,c.address_auth_tag,c.encryption_version FROM users u JOIN user_contact_details c ON c.user_id=u.id WHERE u.email=$1`,
    [email],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].address_ciphertext.includes(Buffer.from(address))).toBe(false);
  expect(rows[0].address_iv.length).toBe(12);
  expect(rows[0].address_auth_tag.length).toBe(16);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/contact-account-${testInfo.project.name}.png`,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  });
  await completeTutorOnboarding(page);
  await expect(page.getByRole('form', { name: 'Ciudad y dirección privadas' })).toHaveCount(0);
  await page.getByRole('button', { name: /LP/ }).click();
  await page.locator('.user-menu').getByRole('link', { name: 'Mi cuenta', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/tutor/cuenta');
  await expect(form.getByLabel('Dirección', { exact: true })).toHaveValue(address);
  await form.getByLabel('Ciudad', { exact: true }).fill('Quito');
  await form
    .getByLabel('Dirección', { exact: true })
    .fill('Dirección ficticia 456, dato actualizado');
  await form.getByRole('button', { name: 'Guardar ciudad y dirección', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('se guardaron correctamente');
  const updated = await pool.query(
    `SELECT c.address_iv FROM users u JOIN user_contact_details c ON c.user_id=u.id WHERE u.email=$1`,
    [email],
  );
  expect(updated.rows[0].address_iv.equals(rows[0].address_iv)).toBe(false);
  await page.getByRole('link', { name: 'Modo estudiante', exact: true }).click();
  await page.goto('/dashboard/cuenta');
  await expect(form.getByLabel('Ciudad', { exact: true })).toHaveValue('Quito');
  expect(await page.getByLabel('Campus', { exact: true }).count()).toBe(0);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});

test('Aviso de privacidad se abre, recibe foco y se cierra', async ({ page }) => {
  await page.goto('/registro');
  await page.getByRole('button', { name: 'aviso de privacidad y uso de mis datos' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Entendido', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('Confirmación de contraseña evita enviar datos incoherentes', async ({ page }) => {
  await page.goto('/registro');
  await fillRegistration(page, `mismatch-${randomUUID()}@example.test`);
  await page
    .getByLabel('Confirmar contraseña', { exact: true })
    .fill('Otra frase completamente distinta');
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
  await expect(page).toHaveURL(/registro/);
});
test('Login incorrecto informa sin dejar entrar', async ({ page }) => {
  const email = `inexistente-${randomUUID()}@example.test`;
  created.push(email);
  await page.goto('/iniciar-sesion');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Una contraseña equivocada');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos');
  await expect(page).toHaveURL(/iniciar-sesion/);
});
test('Registro, duplicado, login, recarga, cuenta y logout reales', async ({ page }, testInfo) => {
  const email = `e2e-${randomUUID()}@example.test`;
  created.push(email);
  await page.goto('/registro');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/registro-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await fillRegistration(page, email);
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await expect(page.getByRole('status')).toContainText('Tu cuenta se creó correctamente');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/login-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const { rows } = await pool.query('SELECT first_name, password_hash FROM users WHERE email=$1', [
    email,
  ]);
  expect(rows[0].first_name).toBe('Lucía');
  expect(rows[0].password_hash).toMatch(/^\$argon2id\$/);
  await page.goto('/registro');
  await fillRegistration(page, email);
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page.getByText('El correo ya está registrado.', { exact: true })).toBeVisible();
  await page.goto('/iniciar-sesion');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Mi frase segura de navegador 2026');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lucía');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lucía');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/panel-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: /LP/ }).click();
  await page.getByRole('link', { name: 'Mi cuenta', exact: true }).click();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole('button', { name: /LP/ }).click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await expect(page.getByRole('status')).toContainText('Cerraste sesión');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/iniciar-sesion/);
});
test('Sin desbordamiento horizontal en portada, login y registro', async ({ page }) => {
  for (const path of ['/', '/iniciar-sesion', '/registro']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
  }
});
test('Ruta desconocida ofrece regreso al inicio', async ({ page }) => {
  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading', { name: 'Tomemos otro camino.' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al inicio', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('Perfil, precios por sesión, detalle, publicación, búsqueda y estados reales', async ({
  page,
  browser,
}, testInfo) => {
  const email = `sprint3-${randomUUID()}@example.test`;
  created.push(email);
  await page.goto('/registro');
  await fillRegistration(page, email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Roca7!A');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Roca7!A');
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/registro/);
  expect(
    await page
      .getByLabel('Contraseña', { exact: true })
      .evaluate((input) => input.validity.tooShort),
  ).toBe(true);
  await page.getByLabel('Contraseña', { exact: true }).fill('Roca7!Az');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Roca7!Az');
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Roca7!Az');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/dashboard/cuenta');
  const academic = page.getByRole('form', { name: 'Actualizar perfil académico' });
  await academic.getByLabel('Nombres', { exact: true }).fill('Lucía Nueva');
  await academic.getByLabel('Semestre', { exact: true }).selectOption('8');
  await academic.getByRole('button', { name: 'Guardar perfil académico' }).click();
  await expect(academic.getByRole('status')).toContainText('se actualizó');
  await completeTutorOnboarding(page, {
    headline: 'Programación',
    bio: 'Me gusta enseñar programación paso a paso con ejemplos claros.',
  });
  await page.getByRole('link', { name: 'Agregar una tutoría', exact: true }).first().click();
  await expect(page).toHaveURL('/dashboard/tutor/publicaciones/nueva');
  const form = page.locator('.publication-form');
  await form.getByLabel('Asignatura', { exact: true }).selectOption({ label: 'Programación' });
  const title = `Programación: límites de prueba ${randomUUID().slice(0, 6)}`;
  await form.getByLabel('Título de la tutoría').fill(title);
  await form
    .getByLabel('Descripción de la tutoría')
    .fill('Explicaciones con ejemplos sencillos y ejercicios prácticos para aprender.');
  await form.getByLabel('Precio por sesión (USD)').fill('8.50');
  await form.getByLabel('Modalidad', { exact: true }).selectOption('virtual');
  await form.getByRole('button', { name: 'Publicar tutoría', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/tutor/publicaciones');
  if (testInfo.project.name === 'chromium') await checkWorkspaceWidths(page);
  const item = page.locator('.publication-manage-item').filter({ hasText: title });
  await expect(item).toBeVisible();
  await expect(item).toContainText('8,50');
  await page.reload();
  await item.getByRole('link', { name: 'Editar', exact: true }).click();
  await form.getByLabel('Título de la tutoría').fill(title + ' editada');
  await form.getByLabel('Precio por sesión (USD)').fill('9.75');
  await form.getByRole('button', { name: 'Guardar publicación', exact: true }).click();
  await expect(item).toContainText('editada');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/sprint3-tutor-${testInfo.project.name}.png`,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  });
  const offerRow = (
    await pool.query(
      'SELECT p.id,p.price_cents,p.price_unit FROM publications p JOIN users u ON u.id=p.tutor_id WHERE u.email=$1 AND p.title=$2',
      [email, title + ' editada'],
    )
  ).rows[0];
  expect(offerRow.price_cents).toBe(975);
  expect(offerRow.price_unit).toBe('session');
  await page.goto('/dashboard?q=programacion');
  const card = page.locator('.publication-card').filter({ hasText: title });
  await expect(card).toBeVisible();
  await page.getByLabel('Buscar por nombre', { exact: true }).fill('limite');
  await page.locator('#publication-subject').selectOption({ label: 'Programación' });
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(card).toBeVisible();
  await expect(page.locator('.active-filters')).toContainText('Nombre: limite');
  await expect(page.locator('.active-filters')).toContainText('Asignatura: Programación');
  await expect
    .poll(() =>
      page.locator('.publication-card .offer-card-titles > .role-label').allTextContents(),
    )
    .toEqual(expect.arrayContaining(['Programación']));
  const cardsSubjects = await page
    .locator('.publication-card .offer-card-titles > .role-label')
    .allTextContents();
  expect(cardsSubjects.every((name) => name === 'Programación')).toBeTruthy();
  await page.locator('#publication-subject').selectOption({ label: 'Cálculo' });
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: 'Eliminar filtros', exact: true }).click();
  await expect(card).toBeVisible();

  await expect(card).toContainText('Lucía Nueva');
  expect(await card.innerText()).not.toContain(email);
  await card.getByRole('link', { name: 'Ver tutoría', exact: true }).click();
  await expect(page).toHaveURL(`/dashboard/publicaciones/${offerRow.id}`);
  await expect(page.getByRole('heading', { name: title + ' editada', exact: true })).toBeVisible();
  await expect(page.locator('.offer-detail')).toContainText('por sesión');
  expect(await page.locator('.offer-detail').innerText()).not.toContain(email);
  const viewerEmail = `viewer-${randomUUID()}@example.test`;
  created.push(viewerEmail);
  const context = await browser.newContext({ viewport: page.viewportSize() });
  const viewer = await context.newPage();
  try {
    await viewer.goto('http://127.0.0.1:5173/registro');
    await fillRegistration(viewer, viewerEmail);
    await viewer.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
    await expect(viewer).toHaveURL(/iniciar-sesion/);
    await viewer.getByLabel('Correo electrónico').fill(viewerEmail);
    await viewer
      .getByLabel('Contraseña', { exact: true })
      .fill('Mi frase segura de navegador 2026');
    await viewer.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(viewer).toHaveURL(/dashboard/);
    const recorded = viewer.waitForResponse(
      (response) =>
        response.url().endsWith(`/publications/${offerRow.id}/view`) &&
        response.request().method() === 'POST' &&
        response.status() === 200,
    );
    await viewer.goto(`http://127.0.0.1:5173/dashboard/publicaciones/${offerRow.id}`);
    await recorded;
    await expect(viewer.locator('.offer-detail')).toContainText('9,75');
    await expect(viewer.getByRole('link', { name: 'Editar mi publicación' })).toHaveCount(0);
  } finally {
    await context.close();
  }
  await page.goto('/dashboard/tutor');
  await expect(page.locator('.tutor-stats')).toContainText('1');
  await captureWorkspace(
    page,
    `docs/evidencias/interior-panel-completo-${testInfo.project.name}.png`,
  );
  await page.goto('/dashboard/tutor/publicaciones');
  await expect(item.locator('.owner-views')).toContainText('1');
  await item.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await expect(item).toContainText('Pausada');
  await page.goto('/dashboard?q=programacion');
  await expect(page.locator('.publication-card').filter({ hasText: title })).toHaveCount(0);
  await page.getByRole('button', { name: 'Eliminar filtros', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page
    .getByLabel('Buscar por nombre', { exact: true })
    .fill(`sin-coincidencias-${randomUUID()}`);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No encontramos tutorías para esta búsqueda.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar filtros', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/evidencias/sprint3-search-${testInfo.project.name}.png`,
    fullPage: true,
    scale: 'css',
    animations: 'disabled',
  });
  await page.goto('/dashboard/tutor/publicaciones');
  await item.getByRole('button', { name: 'Activar', exact: true }).click();
  await expect(item).toContainText('Activa');
  await item.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await expect(item).toContainText('Pausada');
});

test('Login bloquea tras cinco intentos y conserva el bloqueo al recargar', async ({ page }) => {
  const email = `blocked-${randomUUID()}@example.test`;
  created.push(email);
  await page.goto('/iniciar-sesion');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Una clave incorrecta');
  for (let i = 0; i < 5; i++) {
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    const result = await response;
    expect(result.status()).toBe(i === 4 ? 429 : 401);
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled();
  }
  await expect(page.getByRole('alert')).toContainText('15 minutos');
  await page.reload();
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Otra clave');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Demasiados intentos');
});
