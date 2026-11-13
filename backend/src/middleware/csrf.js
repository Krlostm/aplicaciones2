import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
export function issueCsrf(req) {
  req.session.csrfToken = randomBytes(32).toString('hex');
  return req.session.csrfToken;
}
export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.origin)
    return next(new AppError(403, 'El origen de la solicitud no está permitido.'));
  const given = req.get('x-csrf-token');
  const expected = req.session.csrfToken;
  if (
    !given ||
    !expected ||
    Buffer.byteLength(given) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return next(
      new AppError(
        403,
        'La verificación de seguridad expiró. Recarga la página e inténtalo de nuevo.',
      ),
    );
  }
  next();
}
