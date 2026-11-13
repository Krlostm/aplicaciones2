import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHmac } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
import request from 'supertest';
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
process.env.NODE_ENV = 'test';
process.env.ADDRESS_ENCRYPTION_TEST_KEY = randomBytes(32).toString('base64');
const schema = `sprint3_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let app, pool, store, a, b, subject, publication;
const password = 'Roca7!Az';
const base = {
  firstName: 'Lucía',
  lastName: 'Prueba Sprint',
  university: 'ESPOCH',
  degree: 'Software',
  semester: 8,
  acceptedPrivacy: true,
  password,
};
const profile = {
  firstName: 'Lucía Editada',
  lastName: base.lastName,
  university: 'Universidad de prueba',
  degree: 'Ingeniería de Software',
  semester: 7,
};
const token = async (agent) => (await agent.get('/api/auth/csrf').expect(200)).body.csrfToken;
async function account(email) {
  const agent = request.agent(app);
  const csrf = await token(agent);
  const result = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ ...base, email })
    .expect(201);
  const login = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email, password })
    .expect(200);
  return { agent, id: result.body.user.id, email, token: login.body.csrfToken };
}
const put = (actor, url, body) => actor.agent.put(url).set('X-CSRF-Token', actor.token).send(body);
const post = (actor, url, body) =>
  actor.agent.post(url).set('X-CSRF-Token', actor.token).send(body);
const patch = (actor, id, isActive) =>
  actor.agent
    .patch(`/api/publications/${id}/state`)
    .set('X-CSRF-Token', actor.token)
    .send({ isActive });
const fingerprint = (email) =>
  createHmac('sha256', process.env.SESSION_SECRET).update(`login:${email}`).digest('hex');
before(async () => {
  await admin.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
  process.env.DB_SCHEMA = schema;
  ({ app, sessionStore: store } = await import('../src/app.js'));
  ({ pool } = await import('../src/db/pool.js'));
  await (await import('../scripts/migrate.js')).migrate();
  a = await account('sprint-a@example.test');
  b = await account('sprint-b@example.test');
  subject = (await a.agent.get('/api/publications/subjects').expect(200)).body.subjects.find(
    (s) => s.name === 'Programación',
  );
});
after(async () => {
  store?.close();
  await pool?.end();
  await admin.query(`DROP SCHEMA ${pg.escapeIdentifier(schema)} CASCADE`);
  await admin.end();
});

test('Política: acepta 8 caracteres y rechaza 7, claves comunes y más de 128', async () => {
  const { registerSchema } = await import('../src/middleware/validation.js');
  assert.equal(
    registerSchema.safeParse({ ...base, email: 'check@example.test', password }).success,
    true,
  );
  for (const value of ['Roca7!A', '12345678', 'password', 'a'.repeat(129), '😀'.repeat(4)])
    assert.equal(
      registerSchema.safeParse({ ...base, email: 'check@example.test', password: value }).success,
      false,
    );
  assert.equal(
    registerSchema.safeParse({ ...base, email: 'check@example.test', password: 'Ab1!'.repeat(32) })
      .success,
    true,
  );
  await a.agent.get('/api/auth/me').expect(200);
});
test('HU-03 edita únicamente perfil propio y persiste los datos', async () => {
  await request(app).put('/api/auth/profile').send(profile).expect(403);
  const result = await put(a, '/api/auth/profile', profile).expect(200);
  assert.equal(result.body.user.id, a.id);
  assert.equal(result.body.user.semester, 7);
  assert.equal((await a.agent.get('/api/auth/me')).body.user.firstName, profile.firstName);
  assert.equal((await b.agent.get('/api/auth/me')).body.user.firstName, base.firstName);
  const row = (await pool.query('SELECT semester FROM student_profiles WHERE user_id=$1', [a.id]))
    .rows[0];
  assert.equal(row.semester, 7);
});
test('Perfil rechaza datos inválidos, semestre 9 y escalamiento de privilegios', async () => {
  for (const data of [
    { ...profile, semester: 9 },
    { ...profile, firstName: '' },
    { ...profile, role: 'admin' },
    { ...profile, userId: b.id },
    { ...profile, email: 'other@example.test' },
  ])
    await put(a, '/api/auth/profile', data).expect(422);
  assert.equal((await a.agent.get('/api/auth/me')).body.user.role, 'student');
});
test('Unicode no permite eludir mínimos de perfil, dirección, presentación o publicación', async () => {
  const { registerSchema, tutorProfileSchema, contactDetailsSchema, publicationSchema } =
    await import('../src/middleware/validation.js');
  assert.equal(
    registerSchema.safeParse({ ...base, email: 'unicode@example.test', firstName: '😀' }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...base, email: 'unicode@example.test', firstName: '\ud800X' })
      .success,
    false,
  );
  assert.equal(
    tutorProfileSchema.safeParse({ headline: 'TT', bio: '😀'.repeat(10) }).success,
    false,
  );
  assert.equal(
    contactDetailsSchema.safeParse({ city: 'CC', address: '😀'.repeat(3) }).success,
    false,
  );
  assert.equal(
    publicationSchema.safeParse({
      subjectId: subject.id,
      title: '😀'.repeat(3),
      description: 'Descripción válida de tutoría académica.',
      modality: 'virtual',
    }).success,
    false,
  );
});
const offer = () => ({
  subjectId: subject.id,
  title: 'Programación desde cero',
  description: 'Explicaciones claras con ejercicios de práctica y ejemplos paso a paso.',
  modality: 'virtual',
  priceCents: 750,
  priceUnit: 'session',
});
test('Publicaciones requieren sesión, CSRF y perfil de tutor', async () => {
  await request(app).get('/api/publications').expect(401);
  await post(a, '/api/publications', offer()).expect(409);
  await put(a, '/api/tutor-profile', {
    headline: 'Programación',
    bio: 'Aprendamos programación con ejercicios y ejemplos claros.',
  }).expect(200);
  await a.agent.post('/api/publications').send(offer()).expect(403);
  await post(a, '/api/tutor-profile/onboarding', {
    university: profile.university,
    degree: profile.degree,
    semester: profile.semester,
    headline: 'Programación',
    bio: 'Aprendamos programación con ejercicios y ejemplos claros.',
    subjects: [{ subjectId: subject.id, proficiency: 4 }],
  }).expect(200);
});
test('HU-04 crea oferta real con asignatura del catálogo y valida campos', async () => {
  for (const data of [
    { ...offer(), subjectId: randomUUID() },
    { ...offer(), title: '' },
    { ...offer(), description: 'corta' },
    { ...offer(), modality: 'inventada' },
    { ...offer(), tutorId: b.id },
  ])
    await post(a, '/api/publications', data).expect(422);
  publication = (await post(a, '/api/publications', offer()).expect(201)).body.publication;
  assert.equal(
    (await pool.query('SELECT tutor_id FROM publications WHERE id=$1', [publication.id])).rows[0]
      .tutor_id,
    a.id,
  );
});
test('HU-08 busca por título sin distinguir acentos o mayúsculas y omite datos privados', async () => {
  for (const query of ['PROGRAMACION', 'programación']) {
    const result = (await b.agent.get('/api/publications').query({ q: query }).expect(200)).body;
    assert.equal(result.total, 1);
    assert.equal(result.publications[0].id, publication.id);
    assert.deepEqual(Object.keys(result.publications[0].tutor).sort(), [
      'degree',
      'firstName',
      'lastName',
      'university',
    ]);
    assert.equal(JSON.stringify(result).includes(a.email), false);
  }
  assert.equal(
    (await b.agent.get('/api/publications').query({ q: 'sin coincidencias' })).body.total,
    0,
  );
  assert.equal((await b.agent.get('/api/publications').query({ q: "' OR 1=1;--" })).body.total, 0);
  await b.agent.get('/api/publications').query({ page: 0 }).expect(422);
  await b.agent.get('/api/publications').query({ subjectId: 'invalid' }).expect(422);
});

test('Combina nombre parcial y asignatura sin buscar en descripciones ni en el nombre de la materia', async () => {
  const catalog = (await a.agent.get('/api/publications/subjects').expect(200)).body.subjects;
  const calculus = catalog.find((s) => s.name === 'Cálculo');
  const ids = [];
  try {
    for (const data of [
      { title: 'Límites y continuidad', subjectId: calculus.id },
      { title: 'Límites de procesos', subjectId: subject.id },
      {
        title: 'Derivadas desde cero',
        subjectId: calculus.id,
        description: 'Incluye límites y ejercicios prácticos paso a paso.',
      },
    ])
      ids.push(
        (await post(a, '/api/publications', { ...offer(), ...data }).expect(201)).body.publication
          .id,
      );
    for (const q of ['limite', 'LÍMITES']) {
      const all = (await b.agent.get('/api/publications').query({ q }).expect(200)).body;
      assert.equal(all.total, 2);
      assert.deepEqual(new Set(all.publications.map((p) => p.id)), new Set(ids.slice(0, 2)));
      const filtered = (
        await b.agent.get('/api/publications').query({ q, subjectId: calculus.id }).expect(200)
      ).body;
      assert.equal(filtered.total, 1);
      assert.equal(filtered.publications[0].id, ids[0]);
    }
    assert.equal(
      (await b.agent.get('/api/publications').query({ subjectId: calculus.id })).body.total,
      2,
    );
    assert.equal((await b.agent.get('/api/publications').query({ q: 'Cálculo' })).body.total, 0);
    for (const q of ['%', '_', "' OR 1=1;--"])
      assert.equal(
        (await b.agent.get('/api/publications').query({ q, subjectId: calculus.id })).body.total,
        0,
      );
  } finally {
    await pool.query('DELETE FROM publications WHERE id=ANY($1::uuid[])', [ids]);
  }
});
test('HU-05 evita editar o activar publicaciones ajenas', async () => {
  await put(b, `/api/publications/${publication.id}`, { ...offer(), title: 'Ataque ajeno' }).expect(
    404,
  );
  await patch(b, publication.id, false).expect(404);
  assert.equal(
    (await a.agent.get('/api/publications/mine')).body.publications[0].title,
    offer().title,
  );
});
test('HU-05 edita, desactiva y reactiva; solo las activas se encuentran', async () => {
  await put(a, `/api/publications/${publication.id}`, {
    ...offer(),
    title: 'Programación actualizada',
  }).expect(200);
  await patch(a, publication.id, false).expect(200);
  assert.equal((await b.agent.get('/api/publications')).body.total, 0);
  assert.equal((await a.agent.get('/api/publications/mine')).body.publications[0].isActive, false);
  await patch(a, publication.id, true).expect(200);
  assert.equal(
    (await b.agent.get('/api/publications').query({ subjectId: subject.id })).body.total,
    1,
  );
});
test('Cuenta inactiva no aparece en búsquedas y sus ofertas conservan FK', async () => {
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [a.id]);
  try {
    assert.equal((await b.agent.get('/api/publications')).body.total, 0);
  } finally {
    await pool.query('UPDATE users SET is_active=true WHERE id=$1', [a.id]);
  }
  await assert.rejects(
    pool.query('UPDATE publications SET subject_id=$1 WHERE id=$2', [randomUUID(), publication.id]),
    (e) => e.code === '23503',
  );
  await assert.rejects(
    pool.query('UPDATE publications SET title=$1 WHERE id=$2', ['x', publication.id]),
    (e) => e.code === '23514',
  );
});
test('Bloqueo: 5 fallos concurrentes, nueva cookie y contraseña correcta no lo eluden', async () => {
  const agent = request.agent(app);
  const csrf = await token(agent);
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrf)
        .send({ email: b.email, password: 'equivocada' }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [401, 401, 401, 401, 429]);
  const before = (
    await pool.query('SELECT * FROM auth_login_attempts WHERE identifier_hash=$1', [
      fingerprint(b.email),
    ])
  ).rows[0];
  assert.equal(before.failed_count, 5);
  assert.ok(before.locked_until > Date.now());
  const fresh = request.agent(app);
  const next = await token(fresh);
  const response = await fresh
    .post('/api/auth/login')
    .set('X-CSRF-Token', next)
    .send({ email: b.email.toUpperCase(), password })
    .expect(429);
  assert.ok(Number(response.headers['retry-after']) <= 900);
  assert.ok(response.body.retryAfter > 0);
  const after = (
    await pool.query('SELECT locked_until FROM auth_login_attempts WHERE identifier_hash=$1', [
      fingerprint(b.email),
    ])
  ).rows[0];
  assert.equal(after.locked_until.toISOString(), before.locked_until.toISOString());
});
test('Vencimiento desbloquea automáticamente y un login correcto limpia los fallos', async () => {
  await pool.query(
    "UPDATE auth_login_attempts SET locked_until=now()-interval '1 second' WHERE identifier_hash=$1",
    [fingerprint(b.email)],
  );
  const fresh = request.agent(app);
  const csrf = await token(fresh);
  await fresh
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email: b.email, password })
    .expect(200);
  assert.equal(
    (
      await pool.query(
        'SELECT count(*)::int AS total FROM auth_login_attempts WHERE identifier_hash=$1',
        [fingerprint(b.email)],
      )
    ).rows[0].total,
    0,
  );
});
test('Ventana de observación expirada reinicia el contador sin esperar 15 minutos en la prueba', async () => {
  const fresh = request.agent(app);
  const csrf = await token(fresh);
  const fail = () =>
    fresh
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ email: b.email, password: 'equivocada' })
      .expect(401);
  await fail();
  await pool.query(
    "UPDATE auth_login_attempts SET window_started_at=now()-interval '16 minutes' WHERE identifier_hash=$1",
    [fingerprint(b.email)],
  );
  await fail();
  assert.equal(
    (
      await pool.query('SELECT failed_count FROM auth_login_attempts WHERE identifier_hash=$1', [
        fingerprint(b.email),
      ])
    ).rows[0].failed_count,
    1,
  );
});
test('Correos inexistentes reciben el mismo bloqueo y no se guardan en claro', async () => {
  const email = 'nadie-sprint@example.test';
  const fresh = request.agent(app);
  const csrf = await token(fresh);
  for (let i = 0; i < 5; i++)
    await fresh
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ email, password })
      .expect(i === 4 ? 429 : 401);
  const row = (
    await pool.query('SELECT * FROM auth_login_attempts WHERE identifier_hash=$1', [
      fingerprint(email),
    ])
  ).rows[0];
  assert.equal(row.failed_count, 5);
  assert.equal(JSON.stringify(row).includes(email), false);
});
