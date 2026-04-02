import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  AUTH_JWT_SECRET: z.string().min(16).default('dev-only-change-me-please'),
  AUTH_JWT_ISSUER: z.string().default('isms-zinduka'),
  AUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 8),

  SQLITE_PATH: z.string().default('./data/isms.sqlite'),

  PG_HOST: z.string().optional(),
  PG_PORT: z.coerce.number().int().positive().optional(),
  PG_DATABASE: z.string().optional(),
  PG_USER: z.string().optional(),
  PG_PASSWORD: z.string().optional(),
  PG_SSL: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true'))
});

export const env = envSchema.parse(process.env);
