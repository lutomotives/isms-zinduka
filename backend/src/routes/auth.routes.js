import { Router } from 'express';
import { z } from 'zod';

import { validateBody } from '../middleware/validate.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export function createAuthRouter({ services }) {
  const r = Router();

  r.post('/login', validateBody(loginSchema), async (req, res) => {
    const result = await services.auth.login(req.body);
    if (!result) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    return res.json(result);
  });

  return r;
}

