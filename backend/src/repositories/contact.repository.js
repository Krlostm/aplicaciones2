import { pool } from '../db/pool.js';

export const contactRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query('SELECT * FROM user_contact_details WHERE user_id=$1', [
      userId,
    ]);
    return rows[0];
  },
  async save(userId, city, encrypted, database = pool) {
    const { rows } = await database.query(
      `INSERT INTO user_contact_details
       (user_id, city, address_ciphertext, address_iv, address_auth_tag, address_key_id, encryption_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET city=EXCLUDED.city,
       address_ciphertext=EXCLUDED.address_ciphertext, address_iv=EXCLUDED.address_iv,
       address_auth_tag=EXCLUDED.address_auth_tag, address_key_id=EXCLUDED.address_key_id,
       encryption_version=EXCLUDED.encryption_version, updated_at=now()
       RETURNING *`,
      [
        userId,
        city,
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
        encrypted.keyId,
        encrypted.version,
      ],
    );
    return rows[0];
  },
  async storedKeyIds() {
    const { rows } = await pool.query(
      "SELECT to_regclass('user_contact_details') IS NOT NULL AS present",
    );
    if (!rows[0].present) return [];
    const result = await pool.query('SELECT DISTINCT address_key_id FROM user_contact_details');
    return result.rows.map((row) => row.address_key_id);
  },
};
