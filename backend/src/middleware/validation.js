import { z } from 'zod';
import { AppError } from '../utils/errors.js';
const text = (label, max = 120) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .refine((v) => Array.from(v).length >= 2, `${label} debe tener al menos 2 caracteres.`)
    .max(max, `${label} es demasiado largo.`)
    .refine(
      (v) => !/[\u0000-\u001f<>]/.test(v) && !/\p{Cs}/u.test(v),
      `${label} contiene caracteres no válidos.`,
    );
const email = z
  .string({ error: 'Escribe tu correo.' })
  .trim()
  .max(254)
  .email('Escribe un correo válido.')
  .transform((s) => s.toLowerCase());
export const registerSchema = z
  .object({
    firstName: text('El nombre', 80),
    lastName: text('El apellido', 80),
    email,
    password: z
      .string({ error: 'Escribe una contraseña.' })
      .refine((v) => Array.from(v).length >= 8, 'Usa al menos 8 caracteres.')
      .refine((v) => Array.from(v).length <= 128, 'Usa como máximo 128 caracteres.')
      .refine(
        (v) =>
          ![
            '12345678',
            '123456789',
            'password',
            'password123',
            'contraseña',
            'qwerty123',
            'abcdefgh',
            '11111111',
          ].includes(v.toLowerCase()) &&
          !/^(.)\1+$/u.test(v) &&
          !/^\s+$/u.test(v),
        'Elige una contraseña menos predecible.',
      ),
    university: text('La universidad'),
    degree: text('La carrera'),
    semester: z
      .number({ error: 'Selecciona tu semestre.' })
      .int()
      .min(1, 'Selecciona tu semestre.')
      .max(8, 'Selecciona un semestre entre 1 y 8.'),
    acceptedPrivacy: z.literal(true, { error: 'Debes aceptar el aviso de privacidad.' }),
    city: z.union([z.literal(''), text('La ciudad', 100)]).optional(),
    address: z
      .union([
        z.literal(''),
        text('La dirección', 240).refine(
          (v) => Array.from(v).length >= 5,
          'Escribe una dirección de al menos 5 caracteres.',
        ),
      ])
      .optional(),
  })
  .strict();
export const loginSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1, 'Escribe tu contraseña.')
      .max(256)
      .refine((v) => Array.from(v).length <= 128, 'Usa como máximo 128 caracteres.'),
  })
  .strict();
export const profileSchema = registerSchema.pick({
  firstName: true,
  lastName: true,
  university: true,
  degree: true,
  semester: true,
});
export const publicationSchema = z
  .object({
    subjectId: z.uuid('Selecciona una asignatura válida.'),
    title: text('El título', 120).refine(
      (v) => Array.from(v).length >= 5,
      'Usa al menos 5 caracteres.',
    ),
    description: z
      .string()
      .trim()
      .refine((v) => Array.from(v).length >= 20, 'Usa al menos 20 caracteres.')
      .max(2000)
      .refine(
        (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(v),
        'La descripción contiene caracteres no válidos.',
      ),
    modality: z.enum(['virtual', 'presencial', 'ambas'], {
      error: 'Selecciona una modalidad válida.',
    }),
    priceCents: z
      .number({ error: 'Escribe el precio de la tutoría.' })
      .int('Usa como máximo dos decimales.')
      .min(0, 'El precio no puede ser negativo.')
      .max(1000000, 'El precio es demasiado alto.'),
    priceUnit: z
      .literal('session', { error: 'El precio se expresa por sesión.' })
      .default('session'),
  })
  .strict();
export const publicationStateSchema = z.object({ isActive: z.boolean() }).strict();
export const publicationQuerySchema = z
  .object({
    q: z.string().trim().max(100).default(''),
    subjectId: z.uuid().optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict();
export const tutorProfileSchema = z
  .object({
    headline: text('La especialidad', 100),
    bio: z
      .string({ error: 'Escribe tu presentación.' })
      .trim()
      .refine((v) => Array.from(v).length >= 20, 'Cuéntanos sobre ti en al menos 20 caracteres.')
      .max(1500, 'Usa como máximo 1500 caracteres.')
      .refine(
        (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value),
        'La presentación contiene caracteres no válidos.',
      ),
  })
  .strict();
export const contactDetailsSchema = z
  .object({
    city: text('La ciudad', 100),
    address: text('La dirección', 240).refine(
      (v) => Array.from(v).length >= 5,
      'Escribe una dirección de al menos 5 caracteres.',
    ),
  })
  .strict();
export const tutorOnboardingSchema = tutorProfileSchema
  .extend({
    university: registerSchema.shape.university,
    degree: registerSchema.shape.degree,
    semester: registerSchema.shape.semester,
    city: registerSchema.shape.city,
    address: registerSchema.shape.address,
    subjects: z
      .array(
        z
          .object({
            subjectId: z.uuid('Selecciona una materia válida.'),
            proficiency: z.number().int().min(1).max(5),
          })
          .strict(),
      )
      .min(1, 'Selecciona al menos una materia.')
      .max(10, 'Selecciona hasta diez materias.')
      .refine(
        (items) => new Set(items.map((item) => item.subjectId)).size === items.length,
        'No repitas una materia.',
      ),
  })
  .strict();
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) fields[issue.path[0] || 'form'] ??= issue.message;
    return next(new AppError(422, 'Revisa los campos indicados para continuar.', fields));
  }
  req.validated = parsed.data;
  next();
};
