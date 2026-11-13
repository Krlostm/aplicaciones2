import { contactService } from '../services/contact.service.js';

export const contactController = {
  async getOwnContact(req, res) {
    res.json({ contact: await contactService.getOwnContact(req.user.id) });
  },
  async saveOwnContact(req, res) {
    res.json({ contact: await contactService.saveOwnContact(req.user.id, req.validated) });
  },
};
