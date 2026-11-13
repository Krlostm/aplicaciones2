import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
process.env.NODE_ENV = 'test';
process.env.ADDRESS_ENCRYPTION_TEST_KEY = randomBytes(32).toString('base64');
const schema = `workspace_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const password = 'Frase segura de trabajo 2026';
const account = {
  firstName: 'Lucía',
  lastName: 'Prueba Interior',
  university: 'Universidad de prueba',
  degree: 'Software',
  semester: 8,
  acceptedPrivacy: true,
  password,
};
let app, pool, store, a, b, subject, publication;
async function actor(email, extra = {}) {
  const agent = request.agent(app),
    csrf = (await agent.get('/api/auth/csrf')).body.csrfToken;
  const registration = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ ...account, email, ...extra })
    .expect(201);
  const login = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email, password })
    .expect(200);
  return { agent, id: registration.body.user.id, token: login.body.csrfToken };
}
const post = (actor, path, data) =>
  actor.agent.post(path).set('X-CSRF-Token', actor.token).send(data);
const offer = () => ({
  subjectId: subject.id,
  title: 'Programación con ejemplos claros',
  description: 'Aprende programación con ejercicios prácticos y explicaciones paso a paso.',
  modality: 'virtual',
  priceCents: 850,
  priceUnit: 'session',
});
const onboarding = () => ({
  university: account.university,
  degree: account.degree,
  semester: 8,
  headline: 'Programación y bases de datos',
  bio: 'Me gusta explicar con ejercicios claros y acompañar el aprendizaje paso a paso.',
  subjects: [{ subjectId: subject.id, proficiency: 4 }],
});
before(async () => {
  await admin.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
  process.env.DB_SCHEMA = schema;
  ({ app, sessionStore: store } = await import('../src/app.js'));
  ({ pool } = await import('../src/db/pool.js'));
  await (await import('../scripts/migrate.js')).migrate();
  a = await actor('tutor-workspace@example.test', {
    city: 'Ciudad ficticia',
    address: 'Dirección ficticia 123, prueba de registro',
  });
  b = await actor('student-workspace@example.test');
  subject = (await a.agent.get('/api/publications/subjects')).body.subjects.find(
    (s) => s.name === 'Programación',
  );
});
after(async () => {
  store?.close();
  await pool?.end();
  await admin.query(`DROP SCHEMA ${pg.escapeIdentifier(schema)} CASCADE`);
  await admin.end();
});

test('Registro guarda contacto opcional cifrado y no lo expone en identidad', async () => {
  const identity = (await a.agent.get('/api/auth/me')).body.user;
  assert.equal(identity.isTutor, false);
  assert.equal(identity.address, undefined);
  assert.equal(identity.city, undefined);
  const contact = (await a.agent.get('/api/contact-details')).body.contact;
  assert.equal(contact.city, 'Ciudad ficticia');
  assert.equal(contact.address, 'Dirección ficticia 123, prueba de registro');
  const row = (
    await pool.query(
      'SELECT address_ciphertext,address_iv,address_auth_tag FROM user_contact_details WHERE user_id=$1',
      [a.id],
    )
  ).rows[0];
  assert.equal(row.address_ciphertext.includes(Buffer.from(contact.address)), false);
  assert.equal(row.address_iv.length, 12);
  assert.equal(row.address_auth_tag.length, 16);
});
test('Contacto incompleto al registrarse no deja una cuenta parcial', async () => {
  await post(a, '/api/auth/register', {
    ...account,
    email: 'incomplete-workspace@example.test',
    city: 'Ciudad de prueba',
  }).expect(422);
  assert.equal(
    (
      await pool.query('SELECT count(*)::int AS n FROM users WHERE email=$1', [
        'incomplete-workspace@example.test',
      ])
    ).rows[0].n,
    0,
  );
});
test('Guardar un borrador de perfil no habilita publicar ni el modo tutor', async () => {
  await a.agent
    .put('/api/tutor-profile')
    .set('X-CSRF-Token', a.token)
    .send({
      headline: 'Programación',
      bio: 'Una presentación suficiente para guardar como borrador de perfil.',
    })
    .expect(200);
  assert.equal((await a.agent.get('/api/auth/me')).body.user.isTutor, false);
  await post(a, '/api/publications', offer()).expect(409);
});
test('Alta guiada valida materias y dominio, y habilita la misma cuenta', async () => {
  for (const data of [
    { ...onboarding(), subjects: [] },
    { ...onboarding(), subjects: [{ subjectId: subject.id, proficiency: 0 }] },
    { ...onboarding(), subjects: [{ subjectId: subject.id, proficiency: 6 }] },
    { ...onboarding(), subjects: [onboarding().subjects[0], onboarding().subjects[0]] },
    { ...onboarding(), role: 'admin' },
  ])
    await post(a, '/api/tutor-profile/onboarding', data).expect(422);
  await post(a, '/api/tutor-profile/onboarding', {
    ...onboarding(),
    university: 'Cambio que debe revertirse',
    semester: 6,
    subjects: [{ subjectId: randomUUID(), proficiency: 4 }],
  }).expect(422);
  assert.equal((await a.agent.get('/api/auth/me')).body.user.isTutor, false);
  const unchanged = (await a.agent.get('/api/auth/me')).body.user;
  assert.equal(unchanged.university, account.university);
  assert.equal(unchanged.semester, account.semester);
  const result = (await post(a, '/api/tutor-profile/onboarding', onboarding()).expect(200)).body;
  assert.equal(result.user.id, a.id);
  assert.equal(result.user.isTutor, true);
  assert.equal(result.user.role, 'student');
  assert.equal(result.profile.subjects[0].proficiency, 4);
  await a.agent.get('/api/auth/permissions/admin').expect(403);
});
test('El precio por sesión se valida y se guarda exactamente en centavos', async () => {
  for (const data of [
    { ...offer(), priceCents: -1 },
    { ...offer(), priceCents: 8.5 },
    { ...offer(), priceCents: 1000001 },
    { ...offer(), priceCents: '850' },
    { ...offer(), priceUnit: 'hour' },
  ])
    await post(a, '/api/publications', data).expect(422);
  const { priceCents, ...missing } = offer();
  await post(a, '/api/publications', missing).expect(422);
  publication = (await post(a, '/api/publications', offer()).expect(201)).body.publication;
  assert.equal(publication.priceCents, 850);
  assert.equal(publication.priceUnit, 'session');
  assert.equal(
    (await pool.query('SELECT price_cents FROM publications WHERE id=$1', [publication.id])).rows[0]
      .price_cents,
    850,
  );
});
test('Detalle de tutoría muestra precio y presentación sin contacto privado', async () => {
  const result = (await b.agent.get(`/api/publications/${publication.id}`).expect(200)).body
    .publication;
  assert.equal(result.priceCents, 850);
  assert.equal(result.tutor.proficiency, 4);
  assert.equal(result.isOwner, false);
  const text = JSON.stringify(result);
  for (const secret of [
    'Dirección ficticia',
    'Ciudad ficticia',
    'tutor-workspace@example.test',
    'password_hash',
    'address_ciphertext',
  ])
    assert.equal(text.includes(secret), false);
  await request(app).get(`/api/publications/${publication.id}`).expect(401);
  await b.agent.get('/api/publications/invalid').expect(422);
});
test('Las visitas son únicas por estudiante y día y excluyen al propietario', async () => {
  await post(b, `/api/publications/${publication.id}/view`, {}).expect(200);
  await post(b, `/api/publications/${publication.id}/view`, {}).expect(200);
  await post(a, `/api/publications/${publication.id}/view`, {}).expect(200);
  assert.equal((await a.agent.get('/api/publications/mine')).body.publications[0].views, 1);
  assert.equal((await b.agent.get('/api/publications/mine')).body.publications.length, 0);
  await b.agent.post(`/api/publications/${publication.id}/view`).send({}).expect(403);
});
test('Publicaciones pausadas son privadas para su propietario', async () => {
  await a.agent
    .patch(`/api/publications/${publication.id}/state`)
    .set('X-CSRF-Token', a.token)
    .send({ isActive: false })
    .expect(200);
  await b.agent.get(`/api/publications/${publication.id}`).expect(404);
  await post(b, `/api/publications/${publication.id}/view`, {}).expect(404);
  assert.equal(
    (await a.agent.get(`/api/publications/${publication.id}`).expect(200)).body.publication.isOwner,
    true,
  );
  assert.equal((await a.agent.get('/api/publications/mine')).body.publications[0].views, 1);
});
