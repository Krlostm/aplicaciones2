const BASE = import.meta.env.VITE_API_BASE || '/api';
let token;
let tokenRequest;
export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}
async function read(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'No se pudo leer la respuesta del servicio. Inténtalo de nuevo.',
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.message || 'No pudimos completar la solicitud.',
      response.status,
      data.fields,
    );
  return data;
}
async function csrf() {
  if (token) return token;
  tokenRequest ??= fetch(`${BASE}/auth/csrf`, { credentials: 'include', cache: 'no-store' })
    .then(read)
    .then((d) => (token = d.csrfToken))
    .finally(() => {
      tokenRequest = null;
    });
  return tokenRequest;
}
export async function api(path, { method = 'GET', body } = {}) {
  try {
    const headers = { Accept: 'application/json' };
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = await csrf();
    }
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await read(response);
    if (result.csrfToken) token = result.csrfToken;
    if (path === '/auth/logout') token = undefined;
    return result;
  } catch (error) {
    if (error.status === 403) token = undefined;
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'No pudimos conectar. Comprueba que el servicio esté disponible y vuelve a intentarlo.',
      0,
    );
  }
}
export const authApi = {
  updateProfile: (body) => api('/auth/profile', { method: 'PUT', body }),
  me: () => api('/auth/me'),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  register: (body) => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
};
export const tutorApi = {
  completeOnboarding: (body) => api('/tutor-profile/onboarding', { method: 'POST', body }),
  getOwnProfile: () => api('/tutor-profile'),
  saveOwnProfile: (body) => api('/tutor-profile', { method: 'PUT', body }),
};
export const contactApi = {
  getOwnContact: () => api('/contact-details'),
  saveOwnContact: (body) => api('/contact-details', { method: 'PUT', body }),
};
export const publicationApi = {
  detail: (id) => api(`/publications/${id}`),
  recordView: (id) => api(`/publications/${id}/view`, { method: 'POST', body: {} }),
  subjects: () => api('/publications/subjects'),
  mine: () => api('/publications/mine'),
  search: ({ q, subjectId, page }) =>
    api(
      `/publications?${new URLSearchParams({ q, page: String(page), ...(subjectId ? { subjectId } : {}) })}`,
    ),
  create: (body) => api('/publications', { method: 'POST', body }),
  update: (id, body) => api(`/publications/${id}`, { method: 'PUT', body }),
  state: (id, isActive) =>
    api(`/publications/${id}/state`, { method: 'PATCH', body: { isActive } }),
};
