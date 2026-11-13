import { randomUUID } from 'node:crypto';
import { pool } from '../db/pool.js';

export const publicationRepository = {
  async subjects() {
    return (await pool.query('SELECT id,name FROM subjects ORDER BY name')).rows;
  },
  async own(userId) {
    return (
      await pool.query(
        `SELECT p.*,s.name AS subject,(SELECT count(*)::int FROM publication_views v WHERE v.publication_id=p.id) AS views FROM publications p JOIN subjects s ON s.id=p.subject_id
      WHERE tutor_id=$1 ORDER BY created_at DESC,id`,
        [userId],
      )
    ).rows;
  },
  async create(userId, data) {
    return (
      await pool.query(
        `INSERT INTO publications(id,tutor_id,subject_id,title,description,modality,price_cents,price_unit)
      SELECT $1,user_id,$3,$4,$5,$6,$7,$8 FROM tutor_profiles WHERE user_id=$2 AND onboarding_completed_at IS NOT NULL RETURNING *`,
        [
          randomUUID(),
          userId,
          data.subjectId,
          data.title,
          data.description,
          data.modality,
          data.priceCents,
          data.priceUnit,
        ],
      )
    ).rows[0];
  },
  async update(userId, id, data) {
    return (
      await pool.query(
        `UPDATE publications SET subject_id=$3,title=$4,description=$5,modality=$6,price_cents=$7,price_unit=$8,updated_at=now()
      WHERE id=$1 AND tutor_id=$2 RETURNING *`,
        [
          id,
          userId,
          data.subjectId,
          data.title,
          data.description,
          data.modality,
          data.priceCents,
          data.priceUnit,
        ],
      )
    ).rows[0];
  },
  async state(userId, id, isActive) {
    return (
      await pool.query(
        'UPDATE publications SET is_active=$3,updated_at=now() WHERE id=$1 AND tutor_id=$2 RETURNING *',
        [id, userId, isActive],
      )
    ).rows[0];
  },
  async search({ q, subjectId, page }) {
    const where = `p.is_active AND u.is_active AND ($1::uuid IS NULL OR s.id=$1)
      AND strpos(lower(translate(p.title,'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')),lower(translate($2,'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')))>0`;
    const from = `FROM publications p JOIN subjects s ON s.id=p.subject_id JOIN users u ON u.id=p.tutor_id
      JOIN student_profiles a ON a.user_id=u.id`;
    const values = [subjectId || null, q];
    const rows = (
      await pool.query(
        `SELECT p.id,p.title,p.description,p.modality,p.subject_id,p.price_cents,p.price_unit,s.name AS subject,
      u.first_name,u.last_name,a.university,a.degree ${from} WHERE ${where}
      ORDER BY p.created_at DESC,p.id LIMIT 12 OFFSET $3`,
        [...values, (page - 1) * 12],
      )
    ).rows;
    const total = (await pool.query(`SELECT count(*)::int AS total ${from} WHERE ${where}`, values))
      .rows[0].total;
    return { rows, total };
  },
  async detail(id, userId) {
    return (
      await pool.query(
        `SELECT p.*,s.name AS subject,u.first_name,u.last_name,a.university,a.degree,t.headline,t.bio,
      (SELECT proficiency FROM tutor_subjects ts WHERE ts.user_id=p.tutor_id AND ts.subject_id=p.subject_id) AS proficiency
      FROM publications p JOIN subjects s ON s.id=p.subject_id JOIN users u ON u.id=p.tutor_id JOIN student_profiles a ON a.user_id=u.id JOIN tutor_profiles t ON t.user_id=u.id
      WHERE p.id=$1 AND u.is_active AND (p.is_active OR p.tutor_id=$2)`,
        [id, userId],
      )
    ).rows[0];
  },
  async recordView(id, userId) {
    const result = await pool.query(
      `INSERT INTO publication_views(publication_id,viewer_id,viewed_on)
      SELECT p.id,$2,CURRENT_DATE FROM publications p JOIN users u ON u.id=p.tutor_id
      WHERE p.id=$1 AND p.is_active AND u.is_active AND p.tutor_id<>$2 ON CONFLICT DO NOTHING`,
      [id, userId],
    );
    return result.rowCount > 0;
  },
};
