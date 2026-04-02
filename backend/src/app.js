import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { openSqlite } from './config/database.js';
import { logger } from './config/logger.js';

import UserRepository from './models/User.js';
import StudentRepository from './models/Student.js';
import AttendanceRepository from './models/Attendance.js';
import GradeRepository from './models/Grade.js';
import PaymentRepository from './models/Payment.js';
import AnnouncementRepository from './models/Announcement.js';
import SyncLogRepository from './models/SyncLog.js';

import AuthService from './services/auth.service.js';

import { errorHandler } from './middleware/errorHandler.js';

import { createAuthRouter } from './routes/auth.routes.js';
import { createStudentsRouter } from './routes/students.routes.js';
import { createAttendanceRouter } from './routes/attendance.routes.js';
import { createGradesRouter } from './routes/grades.routes.js';
import { createPaymentsRouter } from './routes/payments.routes.js';
import { createAnnouncementsRouter } from './routes/announcements.routes.js';
import { createSyncRouter } from './routes/sync.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  const db = openSqlite();
  const repos = {
    users: new UserRepository(db),
    students: new StudentRepository(db),
    attendance: new AttendanceRepository(db),
    grades: new GradeRepository(db),
    payments: new PaymentRepository(db),
    announcements: new AnnouncementRepository(db),
    syncLog: new SyncLogRepository(db)
  };
  const services = {
    auth: new AuthService({ userRepo: repos.users })
  };

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/auth', createAuthRouter({ services, repos }));
  app.use('/students', createStudentsRouter({ repos }));
  app.use('/attendance', createAttendanceRouter({ repos }));
  app.use('/grades', createGradesRouter({ repos }));
  app.use('/payments', createPaymentsRouter({ repos }));
  app.use('/announcements', createAnnouncementsRouter({ repos }));
  app.use('/sync', createSyncRouter({ repos }));

  app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
  app.use(errorHandler);

  logger.info('App created');
  return app;
}

