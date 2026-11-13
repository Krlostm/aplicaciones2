import { getHealth } from '../services/health.service.js';
export async function health(req, res) {
  res.json(await getHealth());
}
