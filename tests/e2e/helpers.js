import { expect } from '@playwright/test';
async function fitsScreen(page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
  ).toBeTruthy();
  const next = page.locator('.onboarding-actions');
  expect(await next.evaluate((e) => e.getBoundingClientRect().bottom <= innerHeight)).toBeTruthy();
}
export async function completeTutorOnboarding(
  page,
  {
    headline = 'Programación y matemáticas',
    bio = 'Explico con ejemplos claros. Me gusta acompañar el aprendizaje paso a paso.',
    city,
    address,
  } = {},
) {
  await page.goto('/dashboard/ser-tutor');
  await expect(page.getByRole('heading', { name: 'Empecemos por ti.' })).toBeVisible();
  await expect(page.locator('.dashboard-greeting')).toHaveCount(0);
  expect(
    await page.locator('.onboarding-fullscreen').evaluate((e) => e.offsetHeight >= innerHeight),
  ).toBeTruthy();
  if (city !== undefined) await page.getByLabel('Ciudad', { exact: true }).fill(city);
  if (address !== undefined) await page.getByLabel('Dirección', { exact: true }).fill(address);
  await fitsScreen(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  while (!(await page.getByRole('button', { name: 'Programación', exact: true }).count())) {
    await page.getByRole('button', { name: 'Más materias', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Programación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Programación', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Programación', exact: true })).toHaveCSS(
    'background-color',
    'rgb(198, 80, 9)',
  );
  await expect(page.locator('.onboarding-subjects input')).toHaveCount(0);
  await page.getByRole('button', { name: '4: Lo explico con claridad', exact: true }).click();
  await fitsScreen(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Tu especialidad', { exact: true }).fill(headline);
  await page.getByLabel('Presentación', { exact: true }).fill(bio);
  await fitsScreen(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await fitsScreen(page);
  await page.getByRole('button', { name: 'Crear mi perfil de tutor', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/tutor');
}
