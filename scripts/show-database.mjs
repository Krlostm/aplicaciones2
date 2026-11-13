import { pool } from '../backend/src/db/pool.js';
try {
  const { rows: server } = await pool.query(
    'SELECT current_database() AS base, inet_server_addr() AS servidor, inet_server_port() AS puerto, current_user AS rol, version() AS version',
  );
  const { rows: users } = await pool.query(
    `SELECT u.first_name AS nombres, u.last_name AS apellidos, u.email AS correo, p.university AS universidad, p.degree AS carrera, p.semester AS semestre, (u.password_hash LIKE '$argon2id$%') AS hash_argon2id, u.role AS permiso FROM users u JOIN student_profiles p ON p.user_id=u.id ORDER BY u.created_at DESC LIMIT 20`,
  );
  const { rows: sessions } = await pool.query(
    "SELECT count(*)::int AS sesiones_autenticadas FROM auth_sessions WHERE sess::jsonb ? 'userId' AND expire > now()",
  );
  console.log('\nBASE DE DATOS REAL DEL PROYECTO\n');
  console.table(server.map(({ version, ...data }) => data));
  console.log(server[0].version.split(' on ')[0]);
  console.log('\nULTIMAS 20 CUENTAS REGISTRADAS\n');
  console.table(users);
  console.table(sessions);
  console.log('No se muestran contrasenas, hashes completos, cookies ni cadenas de conexion.');
} catch {
  console.error('No se pudo consultar PostgreSQL. Iniciar la aplicacion con Iniciar Tutorias.cmd.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
