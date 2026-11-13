import { publicationService as service } from '../services/publication.service.js';
export const publicationController = {
  async detail(req, res) {
    res.json({ publication: await service.detail(req.params.id, req.user.id) });
  },
  async view(req, res) {
    const recorded = await service.recordView(req.params.id, req.user.id);
    res.json({ recorded });
  },
  async subjects(req, res) {
    res.json({ subjects: await service.subjects() });
  },
  async own(req, res) {
    res.json({ publications: await service.own(req.user.id) });
  },
  async create(req, res) {
    res.status(201).json({ publication: await service.create(req.user.id, req.validated) });
  },
  async update(req, res) {
    res.json({ publication: await service.update(req.user.id, req.params.id, req.validated) });
  },
  async state(req, res) {
    res.json({
      publication: await service.state(req.user.id, req.params.id, req.validated.isActive),
    });
  },
  async search(req, res) {
    res.json(await service.search(req.searchQuery));
  },
};
