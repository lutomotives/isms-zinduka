import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { rbacAllowed } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const createStudentSchema = z.object({
  id: z.string().uuid().optional(),
  admission_no: z.string().min(1).optional().nullable(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['M', 'F', 'O']).optional().nullable(),
  dob: z.string().min(4).optional().nullable(),
  class_name: z.string().min(1).optional().nullable(),
  guardian_name: z.string().min(1).optional().nullable(),
  guardian_phone: z.string().min(7).optional().nullable()
});

const updateStudentSchema = createStudentSchema.partial();

export function createStudentsRouter({ repos }) {
  const r = Router();

  r.use(authRequired);

  r.get('/', (req, res) => {
    const { q, class_name, limit, offset } = req.query;
    const rows = repos.students.list({
      q: q ? String(q) : null,
      class_name: class_name ? String(class_name) : null,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json({ items: rows });
  });

  r.get('/:id', (req, res) => {
    const row = repos.students.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json(row);
  });

  r.post(
    '/',
    rbacAllowed(['headteacher', 'teacher']),
    validateBody(createStudentSchema),
    (req, res) => {
      const created = repos.students.create(req.body);
      res.status(201).json(created);
    }
  );

  r.patch(
    '/:id',
    rbacAllowed(['headteacher', 'teacher']),
    validateBody(updateStudentSchema),
    (req, res) => {
      const updated = repos.students.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
      return res.json(updated);
    }
  );

  r.delete('/:id', rbacAllowed(['headteacher']), (req, res) => {
    const deleted = repos.students.softDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, item: deleted });
  });

  return r;
}

