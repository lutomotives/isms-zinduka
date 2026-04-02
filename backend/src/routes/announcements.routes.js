import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { rbacAllowed } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const createAnnouncementSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  audience_role: z.enum(['all', 'headteacher', 'teacher', 'parent', 'student']).optional()
});

export function createAnnouncementsRouter({ repos }) {
  const r = Router();
  r.use(authRequired);

  r.get('/', (req, res) => {
    const { limit, offset } = req.query;
    const rows = repos.announcements.list({
      audience_role: req.user.role,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json({ items: rows });
  });

  r.post(
    '/',
    rbacAllowed(['headteacher', 'teacher']),
    validateBody(createAnnouncementSchema),
    (req, res) => {
      const row = repos.announcements.create({ ...req.body, created_by_user_id: req.user.id });
      res.status(201).json(row);
    }
  );

  return r;
}

