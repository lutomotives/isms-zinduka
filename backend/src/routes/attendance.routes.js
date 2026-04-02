import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { rbacAllowed } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const markSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  date: z.string().min(8),
  status: z.enum(['present', 'absent', 'late', 'excused'])
});

export function createAttendanceRouter({ repos }) {
  const r = Router();

  r.use(authRequired);

  r.get('/', (req, res) => {
    const { student_id, date, limit, offset } = req.query;
    const rows = repos.attendance.list({
      student_id: student_id ? String(student_id) : null,
      date: date ? String(date) : null,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json({ items: rows });
  });

  r.post(
    '/mark',
    rbacAllowed(['headteacher', 'teacher']),
    validateBody(markSchema),
    (req, res) => {
      const marked = repos.attendance.mark({
        ...req.body,
        marked_by_user_id: req.user.id
      });
      res.status(201).json(marked);
    }
  );

  return r;
}

