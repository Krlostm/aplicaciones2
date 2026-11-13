import { pool } from '../db/pool.js';
import { contactRepository } from './contact.repository.js';

const columns = 'user_id, headline, bio, created_at, updated_at, onboarding_completed_at';

export const tutorRepository = {
  async subjects(userId) {
    return (
      await pool.query(
        `SELECT t.subject_id AS "subjectId",s.name,t.proficiency FROM tutor_subjects t JOIN subjects s ON s.id=t.subject_id WHERE user_id=$1 ORDER BY s.name`,
        [userId],
      )
    ).rows;
  },
  async complete(userId, data, contact) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE student_profiles SET university=$2,degree=$3,semester=$4 WHERE user_id=$1',
        [userId, data.university, data.degree, data.semester],
      );
      await client.query(
        `INSERT INTO tutor_profiles(user_id,headline,bio,onboarding_completed_at) VALUES($1,$2,$3,now()) ON CONFLICT(user_id) DO UPDATE SET headline=EXCLUDED.headline,bio=EXCLUDED.bio,onboarding_completed_at=COALESCE(tutor_profiles.onboarding_completed_at,now()),updated_at=now()`,
        [userId, data.headline, data.bio],
      );
      await client.query('DELETE FROM tutor_subjects WHERE user_id=$1', [userId]);
      for (const subject of data.subjects)
        await client.query(
          'INSERT INTO tutor_subjects(user_id,subject_id,proficiency) VALUES($1,$2,$3)',
          [userId, subject.subjectId, subject.proficiency],
        );
      if (contact) await contactRepository.save(userId, contact.city, contact.encrypted, client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.findByUserId(userId);
  },
  async findByUserId(userId) {
    const { rows } = await pool.query(`SELECT ${columns} FROM tutor_profiles WHERE user_id = $1`, [
      userId,
    ]);
    return rows[0];
  },
  async save(userId, { headline, bio }) {
    const { rows } = await pool.query(
      `INSERT INTO tutor_profiles (user_id, headline, bio) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET headline = EXCLUDED.headline, bio = EXCLUDED.bio, updated_at = now()
       RETURNING ${columns}`,
      [userId, headline, bio],
    );
    return rows[0];
  },
};
