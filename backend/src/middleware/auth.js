import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';
export async function requireAuth(req, res, next) {
  if (
    !req.session.userId ||
    !req.session.authenticatedAt ||
    Date.now() - req.session.authenticatedAt > 8 * 60 * 60 * 1000
  ) {
    return next(new AppError(401, 'Inicia sesión para acceder a tu espacio académico.'));
  }
  const user = await authService.getActiveUser(req.session.userId);
  if (!user) {
    await new Promise((resolve, reject) => req.session.destroy((e) => (e ? reject(e) : resolve())));
    return next(new AppError(401, 'Tu sesión ya no está disponible. Inicia sesión nuevamente.'));
  }
  req.user = user;
  next();
}
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(new AppError(403, 'Tu cuenta no tiene permiso para realizar esta acción.'));
