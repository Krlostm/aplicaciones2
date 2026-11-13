import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validate, registerSchema, loginSchema, profileSchema } from '../middleware/validation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
export const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 200 : 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiados registros desde este equipo. Inténtalo más tarde.' },
});
authRouter.get('/csrf', authController.csrf);
authRouter.post('/register', registerLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', loginLimiter, validate(loginSchema), authController.login);
authRouter.get('/me', requireAuth, authController.me);
authRouter.put('/profile', requireAuth, validate(profileSchema), authController.updateProfile);
authRouter.post('/logout', requireAuth, authController.logout);
// Comprobación del permiso, sin implementar la administración de HU-17.
authRouter.get('/permissions/admin', requireAuth, requireRole('admin'), (req, res) =>
  res.json({ allowed: true }),
);
