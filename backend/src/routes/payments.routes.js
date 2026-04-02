import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { rbacAllowed } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const createPaymentSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).optional(),
  method: z.string().min(1).optional(),
  reference: z.string().min(1).optional().nullable(),
  status: z.enum(['initiated', 'pending', 'confirmed', 'failed', 'cancelled']).optional()
});

export function createPaymentsRouter({ repos }) {
  const r = Router();
  r.use(authRequired);

  r.get('/', (req, res) => {
    const { student_id, status, limit, offset } = req.query;
    const rows = repos.payments.list({
      student_id: student_id ? String(student_id) : null,
      status: status ? String(status) : null,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json({ items: rows });
  });

  r.post(
    '/',
    rbacAllowed(['headteacher', 'parent', 'student']),
    validateBody(createPaymentSchema),
    (req, res) => {
      const row = repos.payments.create({ ...req.body, initiated_by_user_id: req.user.id });
      res.status(201).json(row);
    }
  );

  return r;
}

