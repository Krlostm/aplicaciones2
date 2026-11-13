import { authService } from '../services/auth.service.js';
import { issueCsrf } from '../middleware/csrf.js';
import { env } from '../config/env.js';
const save = (req) =>
  new Promise((resolve, reject) => req.session.save((e) => (e ? reject(e) : resolve())));
export const authController = {
  async csrf(req, res) {
    const csrfToken = req.session.csrfToken || issueCsrf(req);
    await save(req);
    res.json({ csrfToken });
  },
  async register(req, res) {
    const user = await authService.register(req.validated);
    res
      .status(201)
      .json({ user, message: 'Tu cuenta se creó correctamente. Ya puedes iniciar sesión.' });
  },
  async login(req, res) {
    const user = await authService.login(req.validated);
    await new Promise((resolve, reject) =>
      req.session.regenerate((e) => (e ? reject(e) : resolve())),
    );
    req.session.userId = user.id;
    req.session.authenticatedAt = Date.now();
    const csrfToken = issueCsrf(req);
    await save(req);
    res.json({ user, csrfToken });
  },
  me(req, res) {
    res.json({ user: req.user });
  },
  async updateProfile(req, res) {
    res.json({ user: await authService.updateProfile(req.user.id, req.validated) });
  },
  async logout(req, res) {
    await new Promise((resolve, reject) => req.session.destroy((e) => (e ? reject(e) : resolve())));
    res.clearCookie('tutorias.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.production,
      path: '/',
    });
    res.json({ message: 'Cerraste sesión correctamente.' });
  },
};
