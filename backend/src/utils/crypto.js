import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export function signAccessToken({ sub, role }) {
  return jwt.sign(
    { role },
    env.AUTH_JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: env.AUTH_JWT_ISSUER,
      subject: sub,
      expiresIn: env.AUTH_ACCESS_TTL_SECONDS
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.AUTH_JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: env.AUTH_JWT_ISSUER
  });
}

