import { tutorService } from '../services/tutor.service.js';
import { authService } from '../services/auth.service.js';

export const tutorController = {
  async completeOnboarding(req, res) {
    const profile = await tutorService.completeOnboarding(req.user.id, req.validated);
    res.json({ profile, user: await authService.getActiveUser(req.user.id) });
  },
  async getOwnProfile(req, res) {
    res.json({ profile: await tutorService.getOwnProfile(req.user.id) });
  },
  async saveOwnProfile(req, res) {
    res.json({ profile: await tutorService.saveOwnProfile(req.user.id, req.validated) });
  },
};
