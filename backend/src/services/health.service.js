import { checkDatabase } from '../repositories/health.repository.js';
export async function getHealth() {
  return { status: 'ok', database: (await checkDatabase()) ? 'connected' : 'unavailable' };
}
