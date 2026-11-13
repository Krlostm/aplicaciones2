import { pool } from '../db/pool.js';

export const loginAttemptRepository = {
  async attempt(identifier, verify) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [identifier]);
      const { rows } = await client.query(
        'SELECT *, clock_timestamp() AS current_time FROM auth_login_attempts WHERE identifier_hash=$1 FOR UPDATE',
        [identifier],
      );
      const state = rows[0];
      const now =
        state?.current_time || (await client.query('SELECT clock_timestamp() AS now')).rows[0].now;
      let outcome;
      if (state?.locked_until > now)
        outcome = { retryAfter: Math.ceil((state.locked_until - now) / 1000) };
      else {
        const user = await verify(client);
        if (user) {
          await client.query('DELETE FROM auth_login_attempts WHERE identifier_hash=$1', [
            identifier,
          ]);
          outcome = { user };
        } else {
          const fresh = !state || state.locked_until || now - state.window_started_at >= 900000;
          const count = fresh ? 1 : state.failed_count + 1;
          await client.query(
            `INSERT INTO auth_login_attempts VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT(identifier_hash) DO UPDATE SET failed_count=$2,window_started_at=$3,locked_until=$4,last_attempt_at=$5`,
            [
              identifier,
              count,
              fresh ? now : state.window_started_at,
              count >= 5 ? new Date(now.getTime() + 900000) : null,
              now,
            ],
          );
          outcome = count >= 5 ? { retryAfter: 900 } : {};
        }
      }
      await client.query(`DELETE FROM auth_login_attempts WHERE identifier_hash IN
        (SELECT identifier_hash FROM auth_login_attempts WHERE last_attempt_at < now()-interval '24 hours' LIMIT 100 FOR UPDATE SKIP LOCKED)`);
      await client.query('COMMIT');
      return outcome;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
