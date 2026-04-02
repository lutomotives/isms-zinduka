import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { rbacAllowed } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  term: z.string().min(1),
  subject: z.string().min(1),
  score: z.number().optional().nullable(),
  grade: z.string().optional().nullable()
});

export function createGradesRouter({ repos }) {
  const r = Router();

  r.use(authRequired);

  r.get('/', (req, res) => {
    const { student_id, term, limit, offset } = req.query;
    const rows = repos.grades.list({
      student_id: student_id ? String(student_id) : null,
      term: term ? String(term) : null,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json({ items: rows });
  });

  r.post(
    '/upsert',
    rbacAllowed(['headteacher', 'teacher']),
    validateBody(upsertSchema),
    (req, res) => {
      const row = repos.grades.upsert({ ...req.body, recorded_by_user_id: req.user.id });
      res.status(201).json(row);
    }
  );

  return r;
}

