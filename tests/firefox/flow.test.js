import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import puppeteer from 'puppeteer-core';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../../backend/.env', import.meta.url), quiet: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const emails = [];
let browser;
const root = 'http://127.0.0.1:5173';
const password = 'Mi frase segura de navegador 2026';
before(async () => {
  browser = await puppeteer.launch({
    browser: 'firefox',
    protocol: 'webDriverBiDi',
    executablePath: process.env.FIREFOX_PATH || 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  console.log(`Motor comprobado: ${await browser.version()}`);
});
after(async () => {
  if (browser) await browser.close();
  for (const email of emails) {
    const identifier = createHmac('sha256', process.env.SESSION_SECRET)
      .update(`login:${email}`)
      .digest('hex');
    await pool.query('DELETE FROM auth_login_attempts WHERE identifier_hash=$1', [identifier]);
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (rows[0]) {
      await pool.query("DELETE FROM auth_sessions WHERE sess::jsonb->>'userId'=$1", [rows[0].id]);
      await pool.query('DELETE FROM users WHERE id=$1', [rows[0].id]);
    }
  }
  await pool.end();
});
async function withPage(run) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await run(page);
  } finally {
    await context.close();
  }
}
const goto = (page, path) => page.goto(root + path, { waitUntil: 'networkidle0' });
const at = (page, path) => page.waitForFunction((p) => location.pathname === p, {}, path);
async function registerFields(page, email) {
  for (const [id, value] of Object.entries({
    firstName: 'Lucía',
    lastName: 'Prueba Firefox',
    email,
    university: 'ESPOCH',
    degree: 'Ingeniería de Software',
    password,
    confirmPassword: password,
  }))
    await page.locator(`#${id}`).fill(value);
  await page.select('#semester', '7');
  await page.click('input[name=acceptedPrivacy]');
}
test('Firefox: portada, mascota y accesos a registro, login y materias', () =>
  withPage(async (page) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await goto(page, '/');
    assert.match(await page.$eval('h1', (e) => e.textContent), /La universidad,/);
    await page.waitForFunction(() => {
      const mascot = document.querySelector('.landing-mascot');
      return (mascot.videoWidth || mascot.naturalWidth || 0) > 0;
    });
    assert.equal(await page.$$eval('.landing-story', (e) => e.length), 4);
    assert.equal(await page.$$eval('.landing-subject-links a', (e) => e.length), 4);
    await page.click('.landing-button-primary');
    await at(page, '/registro');
    await goto(page, '/');
    await page.click('.landing-button-secondary');
    await at(page, '/iniciar-sesion');
    await goto(page, '/');
    await page.click('.landing-subject-links a');
    await at(page, '/iniciar-sesion');
    await goto(page, '/');
    for (let index = 0; index < 4; index++) {
      await page.evaluate(
        (i) =>
          document
            .querySelectorAll('.landing-story-art img')
            [i].scrollIntoView({ behavior: 'instant' }),
        index,
      );
      await page.waitForFunction(
        (i) => document.querySelectorAll('.landing-story-art img')[i].naturalWidth > 0,
        {},
        index,
      );
      await page.evaluate(
        (i) => document.querySelectorAll('.landing-story-art img')[i].decode(),
        index,
      );
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: 'docs/evidencias/portada-firefox.png', fullPage: true });
    assert.deepEqual(errors, []);
  }));
test('Firefox: panel privado exige iniciar sesión', () =>
  withPage(async (page) => {
    await goto(page, '/dashboard');
    await at(page, '/iniciar-sesion');
    await page.waitForSelector('form[aria-label="Iniciar sesión"]');
  }));
test('Firefox: aviso de privacidad abre y cierra', () =>
  withPage(async (page) => {
    await goto(page, '/registro');
    await page.click('.privacy-check button');
    await page.waitForSelector('dialog[open]');
    await page.click('dialog .btn');
    await page.waitForSelector('dialog', { hidden: true });
  }));
test('Firefox: contraseñas distintas se rechazan en formulario', () =>
  withPage(async (page) => {
    await goto(page, '/registro');
    await registerFields(page, `mismatch-${randomUUID()}@example.test`);
    await page.locator('#confirmPassword').fill('Otra frase de contraseña distinta');
    await page.click('button[type=submit]');
    await page.waitForSelector('#confirmPassword-error');
    assert.match(await page.$eval('#confirmPassword-error', (e) => e.textContent), /no coinciden/);
  }));
test('Firefox: credenciales incorrectas no permiten entrar', () =>
  withPage(async (page) => {
    const email = `inexistente-${randomUUID()}@example.test`;
    emails.push(email);
    await goto(page, '/iniciar-sesion');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.click('button[type=submit]');
    await page.waitForSelector('[role=alert]');
    assert.match(
      await page.$eval('[role=alert]', (e) => e.textContent),
      /Correo o contraseña incorrectos/,
    );
  }));
test('Firefox: cuenta, alta guiada, precio por sesión, detalle y publicación reales', () =>
  withPage(async (page) => {
    const email = `firefox-${randomUUID()}@example.test`;
    emails.push(email);
    await goto(page, '/registro');
    await registerFields(page, email);
    await page.locator('#city').fill('Riobamba');
    const address = 'Dirección ficticia de Firefox 123';
    await page.locator('#address').fill(address);
    await page.click('button[type=submit]');
    await at(page, '/iniciar-sesion');
    await goto(page, '/registro');
    await registerFields(page, email);
    await page.click('button[type=submit]');
    await page.waitForSelector('[role=alert]');
    assert.match(await page.$eval('[role=alert]', (e) => e.textContent), /ya tiene una cuenta/);
    await goto(page, '/iniciar-sesion');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.click('button[type=submit]');
    await at(page, '/dashboard');
    await page.waitForSelector('.workspace-mode-link');
    assert.equal(await page.$('.panel-switch'), null);
    await page.click('a.workspace-mode-link');
    await at(page, '/dashboard/ser-tutor');
    await page.waitForSelector('#onboarding-address');
    assert.equal(await page.$eval('#onboarding-address', (e) => e.value), address);
    await page.click('.onboarding-card button[type=submit]');
    await page.waitForSelector('.onboarding-subjects');
    while (
      !(await page.$$eval('.onboarding-subjects button', (buttons) =>
        buttons.some((b) => b.textContent === 'Programación'),
      ))
    ) {
      await page.click('.onboarding-mini-pager button:last-child');
    }
    const subjectIndex = await page.$$eval('.onboarding-subjects button', (labels) =>
      labels.findIndex((e) => e.textContent === 'Programación'),
    );
    await page.click(`.onboarding-subjects button:nth-child(${subjectIndex + 1})`);
    await page.click('button[aria-label="4: Lo explico con claridad"]');
    await page.click('.onboarding-card button[type=submit]');
    await page.waitForSelector('#headline');
    await page.locator('#headline').fill('Programación con ejemplos');
    await page
      .locator('#bio')
      .fill('Explico programación con ejercicios claros y ejemplos paso a paso.');
    await page.click('.onboarding-card button[type=submit]');
    await page.waitForSelector('.onboarding-review');
    await page.click('.onboarding-card button[type=submit]');
    await at(page, '/dashboard/tutor');
    await page.waitForSelector('.tutor-stats');
    await page.screenshot({ path: 'docs/evidencias/interior-tutor-firefox.png', fullPage: true });
    await goto(page, '/dashboard/tutor/perfil');
    await page.waitForSelector('#headline');
    await page.locator('#headline').fill('Álgebra y programación');
    await page.click('.tutor-form button[type=submit]');
    await page.waitForSelector('.tutor-form [role=status]');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('#headline', (e) => e.value), 'Álgebra y programación');
    await goto(page, '/dashboard/tutor/cuenta');
    await page.waitForSelector('#contact-address');
    assert.equal(await page.$eval('#contact-address', (e) => e.value), address);
    await page.locator('#contact-city').fill('Quito');
    await page.locator('#contact-address').fill('Dirección ficticia de Firefox 456');
    await page.click('.contact-form button[type=submit]');
    await page.waitForSelector('.contact-form [role=status]');
    const row = (
      await pool.query(
        `SELECT c.address_ciphertext,c.address_iv,c.address_auth_tag FROM users u JOIN user_contact_details c ON c.user_id=u.id WHERE u.email=$1`,
        [email],
      )
    ).rows[0];
    assert.equal(
      row.address_ciphertext.includes(Buffer.from('Dirección ficticia de Firefox 456')),
      false,
    );
    assert.equal(row.address_iv.length, 12);
    assert.equal(row.address_auth_tag.length, 16);
    for (const width of [1280, 393]) {
      await page.setViewport({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({
        path: `docs/evidencias/contact-firefox-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewport({ width: 1280, height: 900 });
    await goto(page, '/dashboard/cuenta');
    await page.waitForSelector('#firstName');
    await page.locator('#firstName').fill('Lucía Nueva');
    await page.select('#semester', '8');
    await page.click('.profile-edit-form button[type=submit]');
    await page.waitForSelector('.profile-edit-form [role=status]');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('#firstName', (e) => e.value), 'Lucía Nueva');
    await goto(page, '/dashboard/tutor/publicaciones/nueva');
    await page.waitForFunction(() => document.querySelector('#subjectId')?.options.length > 1);
    const subjectId = await page.$eval(
      '#subjectId',
      (e) => [...e.options].find((o) => o.textContent === 'Programación').value,
    );
    await page.select('#subjectId', subjectId);
    await page.locator('#title').fill('Programación de prueba Firefox');
    await page
      .locator('#description')
      .fill('Explicaciones de programación con ejercicios claros y ejemplos prácticos.');
    await page.locator('#price').fill('7.25');
    await page.click('.publication-form button[type=submit]');
    await at(page, '/dashboard/tutor/publicaciones');
    await page.waitForSelector('.publication-manage-item');
    assert.match(await page.$eval('.publication-manage-item', (e) => e.textContent), /7,25/);
    const publication = (
      await pool.query(
        'SELECT p.id,p.price_cents FROM publications p JOIN users u ON u.id=p.tutor_id WHERE u.email=$1',
        [email],
      )
    ).rows[0];
    assert.equal(publication.price_cents, 725);
    await goto(page, '/dashboard?q=programacion');
    await page.waitForSelector(`a[href="/dashboard/publicaciones/${publication.id}"]`);
    await page.click(`a[href="/dashboard/publicaciones/${publication.id}"]`);
    await at(page, `/dashboard/publicaciones/${publication.id}`);
    await page.waitForSelector('.offer-detail');
    assert.match(await page.$eval('.offer-detail', (e) => e.textContent), /por sesión/);
    assert.equal((await page.$eval('.offer-detail', (e) => e.textContent)).includes(email), false);
    await goto(page, '/dashboard/tutor/publicaciones');
    await page.waitForSelector('.publication-manage-item');
    await page.click('.publication-manage-item button');
    await page.waitForFunction(() =>
      document.querySelector('.publication-manage-item')?.textContent.includes('Pausada'),
    );
    await goto(page, '/dashboard?q=programacion');
    await page.waitForSelector('.publication-count');
    assert.equal(
      await page.$$eval('.publication-card', (cards) =>
        cards.some((c) => c.textContent.includes('Programación de prueba Firefox')),
      ),
      false,
    );
    await page.locator('#publication-query').fill(`sin-coincidencias-${randomUUID()}`);
    await page.click('.publication-search button[type=submit]');
    await page.waitForSelector('.directory-empty');
    await page.click('.active-filters button');
    await page.waitForFunction(() => location.search === '');
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
    await page.click('.user-button');
    await page.click('.user-menu > button');
    await at(page, '/iniciar-sesion');
    await page.waitForSelector('[role=status]');
    assert.match(await page.$eval('[role=status]', (e) => e.textContent), /Cerraste sesión/);
    await goto(page, '/dashboard');
    await at(page, '/iniciar-sesion');
  }));

test('Firefox: escritorio y móvil no desbordan horizontalmente', () =>
  withPage(async (page) => {
    for (const width of [1280, 393]) {
      await page.setViewport({ width, height: 852 });
      for (const path of ['/', '/registro', '/iniciar-sesion']) {
        await goto(page, path);
        await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          overflow: [...document.querySelectorAll('body *')]
            .map((e) => ({
              tag: e.tagName,
              class: e.className,
              right: e.getBoundingClientRect().right,
              left: e.getBoundingClientRect().left,
            }))
            .filter((e) => e.right > innerWidth + 1 || e.left < -1)
            .slice(0, 12),
        }));
        if (geometry.scroll > geometry.width)
          await page.screenshot({
            path: `docs/evidencias/overflow-firefox-${width}-${path.replaceAll('/', '') || 'portada'}.png`,
            fullPage: true,
          });
        assert.equal(
          geometry.scroll <= geometry.width,
          true,
          JSON.stringify({ path, width, ...geometry }),
        );
      }
    }
  }));
test('Firefox: página desconocida permite volver al inicio', () =>
  withPage(async (page) => {
    await goto(page, '/pagina-inexistente');
    assert.match(await page.$eval('h1', (e) => e.textContent), /Tomemos otro camino/);
    await page.click('a.btn');
    await at(page, '/');
  }));
