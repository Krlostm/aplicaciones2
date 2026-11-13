import { publicationRepository as repository } from '../repositories/publication.repository.js';
import { AppError } from '../utils/errors.js';
const dto = (p) => ({
  id: p.id,
  subjectId: p.subject_id,
  subject: p.subject,
  title: p.title,
  description: p.description,
  modality: p.modality,
  isActive: p.is_active,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  priceCents: p.price_cents ?? null,
  priceUnit: p.price_unit || 'session',
  currency: 'USD',
  ...(p.views !== undefined ? { views: p.views } : {}),
});
async function write(operation) {
  try {
    const row = await operation();
    if (!row) throw new AppError(404, 'La publicación no está disponible para tu cuenta.');
    return dto(row);
  } catch (error) {
    if (error.code === '23503')
      throw new AppError(422, 'Selecciona una asignatura del catálogo.', {
        subjectId: 'La asignatura no existe.',
      });
    throw error;
  }
}
export const publicationService = {
  async detail(id, userId) {
    const p = await repository.detail(id, userId);
    if (!p) throw new AppError(404, 'Esta tutoría no está disponible.');
    return {
      ...dto(p),
      isOwner: p.tutor_id === userId,
      tutor: {
        firstName: p.first_name,
        lastName: p.last_name,
        university: p.university,
        degree: p.degree,
        headline: p.headline,
        bio: p.bio,
        proficiency: p.proficiency,
      },
    };
  },
  async recordView(id, userId) {
    await this.detail(id, userId);
    return repository.recordView(id, userId);
  },
  subjects: () => repository.subjects(),
  async own(userId) {
    return (await repository.own(userId)).map(dto);
  },
  async create(userId, data) {
    try {
      return await write(() => repository.create(userId, data));
    } catch (error) {
      if (error.status === 404)
        throw new AppError(409, 'Crea tu perfil de tutor antes de publicar.');
      throw error;
    }
  },
  update: (userId, id, data) => write(() => repository.update(userId, id, data)),
  state: (userId, id, value) => write(() => repository.state(userId, id, value)),
  async search(query) {
    const result = await repository.search(query);
    return {
      publications: result.rows.map((p) => ({
        id: p.id,
        subjectId: p.subject_id,
        subject: p.subject,
        title: p.title,
        description: p.description,
        modality: p.modality,
        priceCents: p.price_cents ?? null,
        priceUnit: p.price_unit,
        currency: 'USD',
        tutor: {
          firstName: p.first_name,
          lastName: p.last_name,
          university: p.university,
          degree: p.degree,
        },
      })),
      total: result.total,
      page: query.page,
      pageSize: 12,
    };
  },
};
