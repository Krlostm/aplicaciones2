import { Router } from 'express';
import { contactController } from '../controllers/contact.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { contactDetailsSchema, validate } from '../middleware/validation.js';

export const contactRouter = Router();
contactRouter.use(requireAuth);
contactRouter.get('/', contactController.getOwnContact);
contactRouter.put('/', validate(contactDetailsSchema), contactController.saveOwnContact);
