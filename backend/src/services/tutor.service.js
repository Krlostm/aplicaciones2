import { tutorRepository } from '../repositories/tutor.repository.js';
import { getAddressCipher } from '../security/address-crypto.js';
import { AppError } from '../utils/errors.js';

function profileData(profile) {
  return profile
    ? {
        userId: profile.user_id,
        headline: profile.headline,
        bio: profile.bio,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        onboardingCompleted: Boolean(profile.onboarding_completed_at),
      }
    : null;
}

export const tutorService = {
  async getOwnProfile(userId) {
    const profile = profileData(await tutorRepository.findByUserId(userId));
    return profile ? { ...profile, subjects: await tutorRepository.subjects(userId) } : null;
  },
  async saveOwnProfile(userId, data) {
    await tutorRepository.save(userId, data);
    return this.getOwnProfile(userId);
  },
  async completeOnboarding(userId, data) {
    if (Boolean(data.city) !== Boolean(data.address))
      throw new AppError(422, 'Completa ciudad y dirección juntas, o deja ambos campos vacíos.', {
        address: 'Revisa tu ciudad y dirección.',
      });
    const contact =
      data.city && data.address
        ? { city: data.city, encrypted: getAddressCipher().encrypt(userId, data.address) }
        : null;
    try {
      await tutorRepository.complete(userId, data, contact);
    } catch (error) {
      if (error.code === '23503')
        throw new AppError(422, 'Selecciona materias del catálogo.', {
          subjects: 'Una de las materias no está disponible.',
        });
      throw error;
    }
    return this.getOwnProfile(userId);
  },
};
