import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
import request from 'supertest';
import argon2 from 'argon2';
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
process.env.NODE_ENV = 'test';
process.env.ADDRESS_ENCRYPTION_TEST_KEY = randomBytes(32).toString('base64');
const schema = `tutorias_test_${randomUUID().replaceAll('-', '')}`;
const adminPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let app, pool, sessionStore;
const student = {
  firstName: 'Lucía',
  lastName: 'Prueba Académica',
  email: 'lucia.prueba@example.test',
  password: 'Una frase segura de prueba 2026',
  university: 'ESPOCH',
  degree: 'Ingeniería de Software',
  semester: 8,
  acceptedPrivacy: true,
};
const getToken = async (agent) => (await agent.get('/api/auth/csrf').expect(200)).body.csrfToken;
async function loginAgent() {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const response = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email: student.email, password: student.password })
    .expect(200);
  return { agent, token: response.body.csrfToken, response };
}
before(async () => {
  await adminPool.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
  process.env.DB_SCHEMA = schema;
  ({ app, sessionStore } = await import('../src/app.js'));
  ({ pool } = await import('../src/db/pool.js'));
  const { migrate } = await import('../scripts/migrate.js');
  await migrate();
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent.post('/api/auth/register').set('X-CSRF-Token', token).send(student).expect(201);
});
after(async () => {
  sessionStore?.close();
  if (pool) await pool.end();
  await adminPool.query(`DROP SCHEMA ${pg.escapeIdentifier(schema)} CASCADE`);
  await adminPool.end();
});
test('API y conexión real a PostgreSQL', async () => {
  const r = await request(app).get('/api/health').expect(200);
  assert.deepEqual(r.body, { status: 'ok', database: 'connected' });
});
test('Migraciones reproducibles y sin duplicaciones', async () => {
  const { migrate } = await import('../scripts/migrate.js');
  await migrate();
  const { rows } = await pool.query('SELECT count(*)::int AS total FROM schema_migrations');
  assert.equal(rows[0].total, 7);
});
test('Registro inserta usuario y perfil en PostgreSQL', async () => {
  const { rows } = await pool.query(
    'SELECT u.id, u.first_name, p.university, p.semester FROM users u JOIN student_profiles p ON p.user_id=u.id WHERE email=$1',
    [student.email],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].first_name, student.firstName);
  assert.equal(rows[0].university, student.university);
  assert.equal(rows[0].semester, student.semester);
});
test('Contraseña protegida con Argon2id y hash verificable', async () => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email=$1', [
    student.email,
  ]);
  assert.match(rows[0].password_hash, /^\$argon2id\$/);
  assert.notEqual(rows[0].password_hash, student.password);
  assert.equal(await argon2.verify(rows[0].password_hash, student.password), true);
});
test('Correo duplicado se rechaza con 409', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const r = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send(student)
    .expect(409);
  assert.ok(r.body.fields.email);
});
test('Unicidad de correo ignora mayúsculas y espacios', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send({ ...student, email: `  ${student.email.toUpperCase()}  ` })
    .expect(409);
});
test('Datos obligatorios inválidos se rechazan por campo', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const r = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send({ ...student, firstName: '', email: 'sin-correo', semester: 0 })
    .expect(422);
  assert.ok(r.body.fields.firstName);
  assert.ok(r.body.fields.email);
  assert.ok(r.body.fields.semester);
  const upperLimit = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send({ ...student, semester: 9 })
    .expect(422);
  assert.ok(upperLimit.body.fields.semester);
});
test('Contraseña corta y falta de consentimiento se rechazan', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const r = await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send({ ...student, password: 'corta', acceptedPrivacy: false })
    .expect(422);
  assert.ok(r.body.fields.password);
  assert.ok(r.body.fields.acceptedPrivacy);
});
test('Registro no permite escalar a administrador', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', token)
    .send({ ...student, email: 'admin@example.test', role: 'admin' })
    .expect(422);
});
test('Registro sin token CSRF se rechaza', async () => {
  await request(app).post('/api/auth/register').send(student).expect(403);
});
test('Login sin token CSRF se rechaza', async () => {
  await request(app)
    .post('/api/auth/login')
    .send({ email: student.email, password: student.password })
    .expect(403);
});
test('Token CSRF incorrecto se rechaza', async () => {
  const agent = request.agent(app);
  await getToken(agent);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', '0'.repeat(64))
    .send({ email: student.email, password: student.password })
    .expect(403);
});
test('Origen externo se rechaza aunque el token sea válido', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent
    .post('/api/auth/login')
    .set('Origin', 'https://otro-sitio.example')
    .set('X-CSRF-Token', token)
    .send({ email: student.email, password: student.password })
    .expect(403);
});
test('Login correcto devuelve identidad real sin hash', async () => {
  const { response } = await loginAgent();
  assert.equal(response.body.user.firstName, student.firstName);
  assert.equal(response.body.user.role, 'student');
  assert.equal(response.body.user.password_hash, undefined);
  assert.equal(response.body.user.password, undefined);
  assert.ok(response.body.csrfToken);
});
test('Cookie HttpOnly, SameSite y duración limitada', async () => {
  const { response } = await loginAgent();
  const cookie = response.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Expires=/);
  assert.match(cookie, /Path=\//);
});
test('Sesión autenticada persiste realmente en PostgreSQL', async () => {
  await loginAgent();
  const { rows } = await pool.query("SELECT sess FROM auth_sessions WHERE sess::jsonb ? 'userId'");
  assert.ok(rows.length > 0);
  assert.equal(typeof rows[0].sess.userId, 'string');
  assert.equal(JSON.stringify(rows[0].sess).includes(student.password), false);
});
test('Login regenera ID y token de sesión para impedir fijación', async () => {
  const agent = request.agent(app);
  const csrf = await agent.get('/api/auth/csrf').expect(200);
  const r = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf.body.csrfToken)
    .send({ email: student.email, password: student.password })
    .expect(200);
  assert.notEqual(
    r.headers['set-cookie'][0].split(';')[0],
    csrf.headers['set-cookie'][0].split(';')[0],
  );
  assert.notEqual(r.body.csrfToken, csrf.body.csrfToken);
});
test('Contraseña incorrecta se rechaza sin sesión autenticada', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const r = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email: student.email, password: 'Contraseña equivocada' })
    .expect(401);
  assert.equal(r.body.user, undefined);
  await agent.get('/api/auth/me').expect(401);
});
test('Cuenta inexistente usa mismo mensaje de error', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  const a = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email: 'nadie@example.test', password: student.password })
    .expect(401);
  const b = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email: student.email, password: 'incorrecta' })
    .expect(401);
  assert.equal(a.body.message, b.body.message);
});
test('Usuario autenticado consulta ruta protegida y recupera sesión', async () => {
  const { agent } = await loginAgent();
  for (let i = 0; i < 2; i++) {
    const r = await agent.get('/api/auth/me').expect(200);
    assert.equal(r.body.user.email, student.email);
    assert.equal(r.headers['cache-control'], 'no-store');
  }
});
test('Sin sesión no se puede consultar identidad privada', async () => {
  await request(app).get('/api/auth/me').expect(401);
});
test('Rol estudiante tiene denegado el permiso administrador', async () => {
  const { agent } = await loginAgent();
  await agent.get('/api/auth/permissions/admin').expect(403);
});
test('Permiso administrador válido se verifica en servidor', async () => {
  const { agent, response } = await loginAgent();
  await pool.query("UPDATE users SET role='admin' WHERE id=$1", [response.body.user.id]);
  try {
    await agent.get('/api/auth/permissions/admin').expect(200);
  } finally {
    await pool.query("UPDATE users SET role='student' WHERE id=$1", [response.body.user.id]);
  }
});
test('Logout sin CSRF no destruye la sesión', async () => {
  const { agent } = await loginAgent();
  await agent.post('/api/auth/logout').expect(403);
  await agent.get('/api/auth/me').expect(200);
});
test('Logout destruye sesión PostgreSQL e invalida la cookie anterior', async () => {
  const { agent, token, response } = await loginAgent();
  const cookie = response.headers['set-cookie'][0].split(';')[0];
  const { rows: before } = await pool.query(
    "SELECT count(*)::int AS total FROM auth_sessions WHERE sess::jsonb ? 'userId'",
  );
  await agent.post('/api/auth/logout').set('X-CSRF-Token', token).expect(200);
  await agent.get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
  const { rows: after } = await pool.query(
    "SELECT count(*)::int AS total FROM auth_sessions WHERE sess::jsonb ? 'userId'",
  );
  assert.equal(after[0].total, before[0].total - 1);
});
test('Cuenta inactiva pierde acceso con una sesión previa', async () => {
  const { agent, response } = await loginAgent();
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [response.body.user.id]);
  try {
    await agent.get('/api/auth/me').expect(401);
  } finally {
    await pool.query('UPDATE users SET is_active=true WHERE id=$1', [response.body.user.id]);
  }
});
test('Sesión con más de 8 horas no permite acceso', async () => {
  const { agent, response } = await loginAgent();
  await pool.query(
    "UPDATE auth_sessions SET sess=jsonb_set(sess::jsonb,'{authenticatedAt}',to_jsonb($1::bigint))::json WHERE sess::jsonb->>'userId'=$2",
    [Date.now() - 9 * 60 * 60 * 1000, response.body.user.id],
  );
  await agent.get('/api/auth/me').expect(401);
});
test('FK y restricción del semestre mantienen integridad', async () => {
  await assert.rejects(
    pool.query(
      'INSERT INTO student_profiles(user_id,university,degree,semester) VALUES ($1,$2,$3,$4)',
      [randomUUID(), 'ESPOCH', 'Software', 5],
    ),
    (e) => e.code === '23503',
  );
  await assert.rejects(
    pool.query('UPDATE student_profiles SET semester=0'),
    (e) => e.code === '23514',
  );
  await assert.rejects(
    pool.query('UPDATE student_profiles SET semester=9'),
    (e) => e.code === '23514',
  );
});
test('SQL malicioso se trata como dato y conserva tablas', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email: "x' OR 1=1;--@example.test", password: 'incorrecta' })
    .expect(422);
  const { userRepository } = await import('../src/repositories/user.repository.js');
  assert.equal(await userRepository.findByEmail("x' OR 1=1;--@example.test"), undefined);
  const { rows } = await pool.query('SELECT count(*)::int AS total FROM users');
  assert.equal(rows[0].total, 1);
});
test('JSON malformado produce error controlado', async () => {
  const r = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send('{invalid')
    .expect(400);
  assert.equal(r.body.message, 'El formato JSON no es válido.');
});
test('Rutas inexistentes devuelven 404 sin traza', async () => {
  const r = await request(app).get('/api/no-existe').expect(404);
  assert.equal(r.body.stack, undefined);
});

const tutorProfile = {
  headline: 'Programación y matemáticas',
  bio: 'Me gusta explicar los conceptos con ejemplos claros y ejercicios paso a paso.',
};

test('Perfil de tutor exige una sesión incluso con CSRF válido', async () => {
  const agent = request.agent(app);
  const token = await getToken(agent);
  await agent.get('/api/tutor-profile').expect(401);
  await agent.put('/api/tutor-profile').set('X-CSRF-Token', token).send(tutorProfile).expect(401);
});

test('Una cuenta nueva no se convierte automáticamente en tutor', async () => {
  const { agent } = await loginAgent();
  const response = await agent.get('/api/tutor-profile').expect(200);
  assert.equal(response.body.profile, null);
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('Perfil inválido se rechaza por campo sin crear filas', async () => {
  const { agent, token } = await loginAgent();
  for (const data of [
    { headline: ' ', bio: 'corta' },
    { headline: 'x'.repeat(101), bio: 'x'.repeat(1501) },
    { headline: '<script>', bio: 'Una presentación con <script> no permitida.' },
  ]) {
    const response = await agent
      .put('/api/tutor-profile')
      .set('X-CSRF-Token', token)
      .send(data)
      .expect(422);
    assert.ok(response.body.fields.headline);
    assert.ok(response.body.fields.bio);
  }
  const { rows } = await pool.query('SELECT count(*)::int AS total FROM tutor_profiles');
  assert.equal(rows[0].total, 0);
});

test('Crear perfil conserva cuenta, credenciales y permiso de estudiante', async () => {
  const { agent, token, response: login } = await loginAgent();
  const before = await pool.query('SELECT password_hash FROM users WHERE id=$1', [
    login.body.user.id,
  ]);
  const response = await agent
    .put('/api/tutor-profile')
    .set('X-CSRF-Token', token)
    .send(tutorProfile)
    .expect(200);
  assert.equal(response.body.profile.userId, login.body.user.id);
  assert.equal(response.body.profile.headline, tutorProfile.headline);
  assert.equal(response.body.profile.bio, tutorProfile.bio);
  assert.equal(response.body.profile.password_hash, undefined);
  const { rows } = await pool.query(
    `SELECT u.role, u.password_hash, p.semester, t.headline FROM users u
     JOIN student_profiles p ON p.user_id=u.id JOIN tutor_profiles t ON t.user_id=u.id WHERE u.id=$1`,
    [login.body.user.id],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].role, 'student');
  assert.equal(rows[0].password_hash, before.rows[0].password_hash);
  assert.equal(rows[0].semester, student.semester);
  assert.equal(rows[0].headline, tutorProfile.headline);
  assert.equal((await agent.get('/api/auth/me').expect(200)).body.user.id, login.body.user.id);
  await agent.get('/api/auth/permissions/admin').expect(403);
});

test('Guardados concurrentes mantienen un único perfil por cuenta', async () => {
  const { agent, token, response } = await loginAgent();
  const original = (await agent.get('/api/tutor-profile')).body.profile;
  await Promise.all(
    ['Álgebra', 'Programación'].map((headline) =>
      agent
        .put('/api/tutor-profile')
        .set('X-CSRF-Token', token)
        .send({ ...tutorProfile, headline })
        .expect(200),
    ),
  );
  const { rows } = await pool.query('SELECT * FROM tutor_profiles WHERE user_id=$1', [
    response.body.user.id,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].created_at.toISOString(), original.createdAt);
  assert.ok(['Álgebra', 'Programación'].includes(rows[0].headline));
  assert.ok(rows[0].updated_at >= rows[0].created_at);
});

test('Guardado sin CSRF o desde origen externo no modifica el perfil', async () => {
  const { agent, token } = await loginAgent();
  const before = (await agent.get('/api/tutor-profile')).body.profile;
  await agent.put('/api/tutor-profile').send(tutorProfile).expect(403);
  await agent
    .put('/api/tutor-profile')
    .set('X-CSRF-Token', token)
    .set('Origin', 'https://otro-sitio.example')
    .send(tutorProfile)
    .expect(403);
  assert.deepEqual((await agent.get('/api/tutor-profile')).body.profile, before);
});

test('No se aceptan identidades o permisos enviados en el perfil', async () => {
  const { agent, token } = await loginAgent();
  for (const extra of [{ userId: randomUUID() }, { role: 'admin' }]) {
    await agent
      .put('/api/tutor-profile')
      .set('X-CSRF-Token', token)
      .send({ ...tutorProfile, ...extra })
      .expect(422);
  }
});

test('Cada sesión solo puede consultar y editar su propio perfil de tutor', async () => {
  const { agent: first, response: login } = await loginAgent();
  const original = (await first.get('/api/tutor-profile')).body.profile;
  const second = request.agent(app);
  const email = `tutor-${randomUUID()}@example.test`;
  let secondId;
  try {
    const token = await getToken(second);
    secondId = (
      await second
        .post('/api/auth/register')
        .set('X-CSRF-Token', token)
        .send({ ...student, email })
        .expect(201)
    ).body.user.id;
    const session = await second
      .post('/api/auth/login')
      .set('X-CSRF-Token', token)
      .send({ email, password: student.password })
      .expect(200);
    assert.equal((await second.get('/api/tutor-profile')).body.profile, null);
    const saved = await second
      .put('/api/tutor-profile')
      .set('X-CSRF-Token', session.body.csrfToken)
      .send({ ...tutorProfile, headline: 'Otra especialidad' })
      .expect(200);
    assert.equal(saved.body.profile.userId, secondId);
    await second.get(`/api/tutor-profile/${login.body.user.id}`).expect(404);
    assert.deepEqual((await first.get('/api/tutor-profile')).body.profile, original);
  } finally {
    if (secondId) {
      await pool.query("DELETE FROM auth_sessions WHERE sess::jsonb->>'userId'=$1", [secondId]);
      await pool.query('DELETE FROM users WHERE id=$1', [secondId]);
      const { rows } = await pool.query(
        'SELECT count(*)::int AS total FROM tutor_profiles WHERE user_id=$1',
        [secondId],
      );
      assert.equal(rows[0].total, 0);
    }
  }
});

test('PostgreSQL impide tutores huérfanos, duplicados y presentaciones inválidas', async () => {
  const { response } = await loginAgent();
  await assert.rejects(
    pool.query('INSERT INTO tutor_profiles(user_id,headline,bio) VALUES ($1,$2,$3)', [
      randomUUID(),
      tutorProfile.headline,
      tutorProfile.bio,
    ]),
    (e) => e.code === '23503',
  );
  await assert.rejects(
    pool.query('INSERT INTO tutor_profiles(user_id,headline,bio) VALUES ($1,$2,$3)', [
      response.body.user.id,
      tutorProfile.headline,
      tutorProfile.bio,
    ]),
    (e) => e.code === '23505',
  );
  await assert.rejects(
    pool.query('UPDATE tutor_profiles SET bio=$1 WHERE user_id=$2', [
      'corta',
      response.body.user.id,
    ]),
    (e) => e.code === '23514',
  );
});

test('Una cuenta desactivada pierde también el acceso al perfil de tutor', async () => {
  const { agent, token, response } = await loginAgent();
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [response.body.user.id]);
  try {
    await agent.put('/api/tutor-profile').set('X-CSRF-Token', token).send(tutorProfile).expect(401);
    await agent.get('/api/tutor-profile').expect(401);
  } finally {
    await pool.query('UPDATE users SET is_active=true WHERE id=$1', [response.body.user.id]);
  }
});

const contactDetails = { city: 'Riobamba', address: 'Calle de prueba 123 y Avenida de ejemplo' };

test('Ciudad y dirección exigen sesión y empiezan sin datos inventados', async () => {
  const anonymous = request.agent(app);
  const anonymousToken = await getToken(anonymous);
  await anonymous.get('/api/contact-details').expect(401);
  await anonymous
    .put('/api/contact-details')
    .set('X-CSRF-Token', anonymousToken)
    .send(contactDetails)
    .expect(401);
  const { agent } = await loginAgent();
  assert.equal((await agent.get('/api/contact-details').expect(200)).body.contact, null);
});

test('Validación separa ciudad y dirección y rechaza campus e identidad del cliente', async () => {
  const { agent, token } = await loginAgent();
  for (const data of [
    { city: '', address: '123' },
    { city: 'x'.repeat(101), address: 'x'.repeat(241) },
    { city: '<script>', address: 'Una dirección con <script>' },
  ]) {
    const response = await agent
      .put('/api/contact-details')
      .set('X-CSRF-Token', token)
      .send(data)
      .expect(422);
    assert.ok(response.body.fields.city);
    assert.ok(response.body.fields.address);
  }
  for (const extra of [{ campus: 'No solicitado' }, { userId: randomUUID() }, { role: 'admin' }]) {
    await agent
      .put('/api/contact-details')
      .set('X-CSRF-Token', token)
      .send({ ...contactDetails, ...extra })
      .expect(422);
  }
  assert.equal((await agent.get('/api/contact-details')).body.contact, null);
});

test('La API devuelve la dirección al propietario y PostgreSQL solo guarda su cifrado', async () => {
  const { agent, token, response: login } = await loginAgent();
  const saved = await agent
    .put('/api/contact-details')
    .set('X-CSRF-Token', token)
    .send(contactDetails)
    .expect(200);
  assert.equal(saved.body.contact.city, contactDetails.city);
  assert.equal(saved.body.contact.address, contactDetails.address);
  assert.deepEqual(Object.keys(saved.body.contact).sort(), ['address', 'city', 'updatedAt']);
  const { rows } = await pool.query('SELECT * FROM user_contact_details WHERE user_id=$1', [
    login.body.user.id,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].city, contactDetails.city);
  assert.equal(rows[0].address, undefined);
  assert.equal(rows[0].address_ciphertext.includes(Buffer.from(contactDetails.address)), false);
  assert.equal(rows[0].address_iv.length, 12);
  assert.equal(rows[0].address_auth_tag.length, 16);
  assert.equal(rows[0].encryption_version, 1);
  const own = await agent.get('/api/contact-details').expect(200);
  assert.equal(own.body.contact.address, contactDetails.address);
  assert.equal(own.headers['cache-control'], 'no-store');
});

test('Editar datos compartidos conserva una sola fila y renueva el IV del cifrado', async () => {
  const { agent, token, response } = await loginAgent();
  const before = (
    await pool.query('SELECT * FROM user_contact_details WHERE user_id=$1', [response.body.user.id])
  ).rows[0];
  await agent
    .put('/api/contact-details')
    .set('X-CSRF-Token', token)
    .send({ ...contactDetails, city: 'Quito' })
    .expect(200);
  const { rows } = await pool.query('SELECT * FROM user_contact_details WHERE user_id=$1', [
    response.body.user.id,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].city, 'Quito');
  assert.equal(rows[0].created_at.toISOString(), before.created_at.toISOString());
  assert.ok(!rows[0].address_iv.equals(before.address_iv));
  assert.ok(!rows[0].address_ciphertext.equals(before.address_ciphertext));
  assert.equal((await agent.get('/api/tutor-profile')).body.profile.userId, response.body.user.id);
  assert.equal((await agent.get('/api/auth/me')).body.user.role, 'student');
});

test('CSRF y origen protegen el guardado de la dirección', async () => {
  const { agent, token } = await loginAgent();
  const before = (await agent.get('/api/contact-details')).body;
  await agent.put('/api/contact-details').send(contactDetails).expect(403);
  await agent
    .put('/api/contact-details')
    .set('X-CSRF-Token', token)
    .set('Origin', 'https://otro-sitio.example')
    .send(contactDetails)
    .expect(403);
  assert.deepEqual((await agent.get('/api/contact-details')).body, before);
});

test('Identidad y perfil de tutor no exponen la dirección ni metadatos criptográficos', async () => {
  const { agent, response } = await loginAgent();
  for (const body of [
    response.body,
    (await agent.get('/api/auth/me')).body,
    (await agent.get('/api/tutor-profile')).body,
  ]) {
    assert.equal(JSON.stringify(body).includes(contactDetails.address), false);
    assert.equal(JSON.stringify(body).includes('address_ciphertext'), false);
    assert.equal(JSON.stringify(body).includes('address_key_id'), false);
  }
});

test('Alterar el ciphertext impide leer la dirección y no invalida la identidad', async () => {
  const { agent, response } = await loginAgent();
  const original = (
    await pool.query('SELECT address_ciphertext FROM user_contact_details WHERE user_id=$1', [
      response.body.user.id,
    ])
  ).rows[0].address_ciphertext;
  const tampered = Buffer.from(original);
  tampered[0] ^= 1;
  try {
    await pool.query('UPDATE user_contact_details SET address_ciphertext=$1 WHERE user_id=$2', [
      tampered,
      response.body.user.id,
    ]);
    const result = await agent.get('/api/contact-details').expect(503);
    assert.equal(result.body.contact, undefined);
    assert.equal(JSON.stringify(result.body).includes(contactDetails.address), false);
    assert.equal(result.body.stack, undefined);
    await agent.get('/api/auth/me').expect(200);
  } finally {
    await pool.query('UPDATE user_contact_details SET address_ciphertext=$1 WHERE user_id=$2', [
      original,
      response.body.user.id,
    ]);
  }
});

test('Una segunda cuenta no consulta datos ajenos y AAD detecta filas copiadas', async () => {
  const { agent: first, response } = await loginAgent();
  const original = (await first.get('/api/contact-details')).body.contact;
  const second = request.agent(app);
  const email = `contact-${randomUUID()}@example.test`;
  let secondId;
  try {
    const token = await getToken(second);
    secondId = (
      await second
        .post('/api/auth/register')
        .set('X-CSRF-Token', token)
        .send({ ...student, email })
        .expect(201)
    ).body.user.id;
    const login = await second
      .post('/api/auth/login')
      .set('X-CSRF-Token', token)
      .send({ email, password: student.password })
      .expect(200);
    assert.equal((await second.get('/api/contact-details')).body.contact, null);
    await second.get(`/api/contact-details/${response.body.user.id}`).expect(404);
    await second
      .put('/api/contact-details')
      .set('X-CSRF-Token', login.body.csrfToken)
      .send({ city: 'Cuenca', address: 'Dirección ficticia de la segunda cuenta' })
      .expect(200);
    assert.deepEqual((await first.get('/api/contact-details')).body.contact, original);
    // Copiar el contenido cifrado entre cuentas no permite descifrarlo como otra persona.
    await assert.rejects(
      pool.query(
        `UPDATE user_contact_details dst SET address_ciphertext=src.address_ciphertext,
       address_auth_tag=src.address_auth_tag, address_iv=src.address_iv
       FROM user_contact_details src WHERE src.user_id=$1 AND dst.user_id=$2`,
        [response.body.user.id, secondId],
      ),
      (e) => e.code === '23505',
    );
    const { getAddressCipher } = await import('../src/security/address-crypto.js');
    const { rows } = await pool.query('SELECT * FROM user_contact_details WHERE user_id=$1', [
      response.body.user.id,
    ]);
    assert.throws(
      () =>
        getAddressCipher().decrypt(secondId, {
          ciphertext: rows[0].address_ciphertext,
          iv: rows[0].address_iv,
          authTag: rows[0].address_auth_tag,
          keyId: rows[0].address_key_id,
          version: rows[0].encryption_version,
        }),
      /No se pudo verificar/,
    );
  } finally {
    if (secondId) {
      await pool.query("DELETE FROM auth_sessions WHERE sess::jsonb->>'userId'=$1", [secondId]);
      await pool.query('DELETE FROM users WHERE id=$1', [secondId]);
      assert.equal(
        (
          await pool.query(
            'SELECT count(*)::int AS total FROM user_contact_details WHERE user_id=$1',
            [secondId],
          )
        ).rows[0].total,
        0,
      );
    }
  }
});

test('PostgreSQL valida FK, IV y etiqueta de los datos privados', async () => {
  const { response } = await loginAgent();
  const id = response.body.user.id;
  await assert.rejects(
    pool.query('UPDATE user_contact_details SET address_iv=$1 WHERE user_id=$2', [
      Buffer.alloc(8),
      id,
    ]),
    (e) => e.code === '23514',
  );
  await assert.rejects(
    pool.query('UPDATE user_contact_details SET address_auth_tag=$1 WHERE user_id=$2', [
      Buffer.alloc(8),
      id,
    ]),
    (e) => e.code === '23514',
  );
  await assert.rejects(
    pool.query('UPDATE user_contact_details SET user_id=$1 WHERE user_id=$2', [randomUUID(), id]),
    (e) => e.code === '23503',
  );
});

test('Cuenta desactivada no puede actualizar ni consultar ciudad y dirección', async () => {
  const { agent, token, response } = await loginAgent();
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [response.body.user.id]);
  try {
    await agent
      .put('/api/contact-details')
      .set('X-CSRF-Token', token)
      .send(contactDetails)
      .expect(401);
    await agent.get('/api/contact-details').expect(401);
  } finally {
    await pool.query('UPDATE users SET is_active=true WHERE id=$1', [response.body.user.id]);
  }
});
