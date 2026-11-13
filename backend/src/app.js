import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { authRouter } from './routes/auth.routes.js';
import { tutorRouter } from './routes/tutor.routes.js';
import { contactRouter } from './routes/contact.routes.js';
import { publicationRouter } from './routes/publication.routes.js';
import { health } from './controllers/health.controller.js';
import { csrfProtection } from './middleware/csrf.js';
export const sessionStore = new (connectPgSimple(session))({
  pool,
  schemaName: process.env.DB_SCHEMA || 'public',
  tableName: 'auth_sessions',
  createTableIfMissing: false,
  pruneSessionInterval: 60,
});
export const app = express();
app.disable('x-powered-by');
if (env.production) app.set('trust proxy', 1);
app.use(helmet());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '16kb' }));
app.get('/api/health', health);
app.use(
  '/api',
  session({
    name: 'tutorias.sid',
    store: sessionStore,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.production,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    },
  }),
);
app.use('/api', csrfProtection);
app.use('/api/auth', authRouter);
app.use('/api/tutor-profile', tutorRouter);
app.use('/api/contact-details', contactRouter);
app.use('/api/publications', publicationRouter);
app.use((req, res) => res.status(404).json({ message: 'La ruta solicitada no existe.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const dbFailure = ['ECONNREFUSED', 'ETIMEDOUT', '57P01', '53300'].includes(error.code);
  const status = error.status || (dbFailure ? 503 : 500);
  if (error.retryAfter) res.set('Retry-After', String(error.retryAfter));
  if (status >= 500)
    console.error(`Error del servidor (${status}); código: ${error.code || 'interno'}.`);
  res.status(status).json({
    message:
      status >= 500
        ? 'No podemos conectar con el servicio en este momento. Inténtalo nuevamente.'
        : error.type === 'entity.parse.failed'
          ? 'El formato JSON no es válido.'
          : error.message,
    ...(error.fields ? { fields: error.fields } : {}),
    ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
  });
});
