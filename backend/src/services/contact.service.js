import { contactRepository } from '../repositories/contact.repository.js';
import { getAddressCipher } from '../security/address-crypto.js';
import { AppError } from '../utils/errors.js';

function ownContact(row) {
  if (!row) return null;
  try {
    return {
      city: row.city,
      address: getAddressCipher().decrypt(row.user_id, {
        ciphertext: row.address_ciphertext,
        iv: row.address_iv,
        authTag: row.address_auth_tag,
        keyId: row.address_key_id,
        version: row.encryption_version,
      }),
      updatedAt: row.updated_at,
    };
  } catch {
    throw new AppError(503, 'No se pudo acceder a la dirección guardada.');
  }
}

export const contactService = {
  async getOwnContact(userId) {
    return ownContact(await contactRepository.findByUserId(userId));
  },
  async saveOwnContact(userId, { city, address }) {
    const encrypted = getAddressCipher().encrypt(userId, address);
    return ownContact(await contactRepository.save(userId, city, encrypted));
  },
};
