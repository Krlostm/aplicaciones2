import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  validate,
  publicationSchema,
  publicationStateSchema,
  publicationQuerySchema,
} from '../middleware/validation.js';
import { publicationController as controller } from '../controllers/publication.controller.js';
import { AppError } from '../utils/errors.js';
export const publicationRouter = Router();
publicationRouter.use(requireAuth);
publicationRouter.get('/subjects', controller.subjects);
publicationRouter.get('/mine', controller.own);
publicationRouter.get(
  '/',
  (req, res, next) => {
    const parsed = publicationQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(new AppError(422, 'Revisa los criterios de búsqueda.'));
    req.searchQuery = parsed.data;
    next();
  },
  controller.search,
);
publicationRouter.post('/', validate(publicationSchema), controller.create);
publicationRouter.param('id', (req, res, next, id) =>
  z.uuid().safeParse(id).success
    ? next()
    : next(new AppError(422, 'Identificador de publicación inválido.')),
);
publicationRouter.put('/:id', validate(publicationSchema), controller.update);
publicationRouter.get('/:id', controller.detail);
publicationRouter.post('/:id/view', validate(z.object({}).strict()), controller.view);
publicationRouter.patch('/:id/state', validate(publicationStateSchema), controller.state);
