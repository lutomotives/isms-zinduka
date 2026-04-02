import { Router } from 'express';
import { z } from 'zod';

import { authRequired } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

import SyncEngine from '../sync/syncEngine.js';

const pushSchema = z.object({
  changes: z.record(z.string(), z.array(z.record(z.any())).default([])).default({})
});

export function createSyncRouter({ repos }) {
  const r = Router();
  r.use(authRequired);

  const engine = new SyncEngine({ repos });

  r.post('/push', validateBody(pushSchema), (req, res) => {
    const result = engine.push({ changes: req.body.changes, actorUserId: req.user.id });
    res.json(result);
  });

  r.get('/pull', (req, res) => {
    const since = req.query.since ? String(req.query.since) : null;
    const limitPerEntity = req.query.limitPerEntity ? Number(req.query.limitPerEntity) : 500;
    const result = engine.pull({ since, limitPerEntity });
    res.json(result);
  });

  return r;
}

