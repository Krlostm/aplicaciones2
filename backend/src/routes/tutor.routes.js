import { Router } from 'express';
import { tutorController } from '../controllers/tutor.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { tutorProfileSchema, tutorOnboardingSchema, validate } from '../middleware/validation.js';

export const tutorRouter = Router();
tutorRouter.use(requireAuth);
// La identidad siempre procede de la sesión; no se acepta un userId del cliente.
tutorRouter.get('/', tutorController.getOwnProfile);
tutorRouter.post(
  '/onboarding',
  validate(tutorOnboardingSchema),
  tutorController.completeOnboarding,
);
tutorRouter.put('/', validate(tutorProfileSchema), tutorController.saveOwnProfile);
