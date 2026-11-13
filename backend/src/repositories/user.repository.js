import { randomUUID } from 'node:crypto';
import { pool } from '../db/pool.js';
import { contactRepository } from './contact.repository.js';
const selectUser = `SELECT u.id, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.is_active, u.created_at,
  p.university, p.degree, p.semester,
  EXISTS(SELECT 1 FROM tutor_profiles t WHERE t.user_id=u.id AND t.onboarding_completed_at IS NOT NULL) AS is_tutor
  FROM users u JOIN student_profiles p ON p.user_id = u.id`;
export const userRepository = {
  async findByEmail(email, database = pool) {
    const { rows } = await database.query(`${selectUser} WHERE u.email = $1`, [email]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await pool.query(`${selectUser} WHERE u.id = $1`, [id]);
    return rows[0];
  },
  async updateProfile(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE users SET first_name=$2,last_name=$3,updated_at=now() WHERE id=$1',
        [id, data.firstName, data.lastName],
      );
      await client.query(
        'UPDATE student_profiles SET university=$2,degree=$3,semester=$4 WHERE user_id=$1',
        [id, data.university, data.degree, data.semester],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.findById(id);
  },
  async create(data, passwordHash, options = {}) {
    const client = await pool.connect();
    const id = options.id || randomUUID();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO users(id, first_name, last_name, email, password_hash) VALUES ($1,$2,$3,$4,$5)',
        [id, data.firstName, data.lastName, data.email, passwordHash],
      );
      await client.query(
        'INSERT INTO student_profiles(user_id, university, degree, semester) VALUES ($1,$2,$3,$4)',
        [id, data.university, data.degree, data.semester],
      );
      if (options.contact)
        await contactRepository.save(id, options.contact.city, options.contact.encrypted, client);
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
