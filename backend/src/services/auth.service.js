import argon2 from 'argon2';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { getAddressCipher } from '../security/address-crypto.js';
import { env } from '../config/env.js';
import { loginAttemptRepository } from '../repositories/login-attempt.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const dummyHash = await argon2.hash(randomBytes(32), hashOptions);
export function publicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    university: user.university,
    degree: user.degree,
    semester: user.semester,
    createdAt: user.created_at,
    isTutor: Boolean(user.is_tutor),
  };
}
export const authService = {
  async register(data) {
    if (Boolean(data.city) !== Boolean(data.address))
      throw new AppError(
        422,
        'Completa la ciudad y la dirección juntas, o deja ambos campos vacíos.',
        {
          city: data.city ? undefined : 'Completa tu ciudad.',
          address: data.address ? undefined : 'Completa tu dirección.',
        },
      );
    const hash = await argon2.hash(data.password, hashOptions);
    const id = randomUUID();
    const contact =
      data.city && data.address
        ? { city: data.city, encrypted: getAddressCipher().encrypt(id, data.address) }
        : null;
    try {
      await userRepository.create(data, hash, { id, contact });
      return publicUser(await userRepository.findById(id));
    } catch (error) {
      if (error.code === '23505')
        throw new AppError(409, 'Este correo ya tiene una cuenta. Inicia sesión para continuar.', {
          email: 'El correo ya está registrado.',
        });
      throw error;
    }
  },
  async login({ email, password }) {
    const identifier = createHmac('sha256', env.sessionSecret)
      .update(`login:${email}`)
      .digest('hex');
    const outcome = await loginAttemptRepository.attempt(identifier, async (database) => {
      const user = await userRepository.findByEmail(email, database);
      const valid = await argon2.verify(user?.password_hash || dummyHash, password);
      return user && valid && user.is_active ? user : null;
    });
    if (outcome.retryAfter) {
      const error = new AppError(
        429,
        `Demasiados intentos. Inténtalo nuevamente en ${Math.ceil(outcome.retryAfter / 60)} minutos.`,
      );
      error.retryAfter = outcome.retryAfter;
      throw error;
    }
    if (!outcome.user)
      throw new AppError(
        401,
        'Correo o contraseña incorrectos. Revisa tus datos e inténtalo otra vez.',
      );
    return publicUser(outcome.user);
  },
  async updateProfile(userId, data) {
    return publicUser(await userRepository.updateProfile(userId, data));
  },
  async getActiveUser(id) {
    const user = await userRepository.findById(id);
    return user?.is_active ? publicUser(user) : null;
  },
};
