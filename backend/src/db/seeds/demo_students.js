import crypto from 'node:crypto';
import process from 'node:process';

import { openSqlite } from '../../config/database.js';
import { logger } from '../../config/logger.js';

import StudentRepository from '../../models/Student.js';
import UserRepository from '../../models/User.js';

function parseArgs(argv) {
  const args = { force: false, className: 'Grade 4' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    if (a === '--class') args.className = argv[i + 1] ?? args.className;
  }
  return args;
}

export function seedDemoStudents({ db, force = false, className = 'Grade 4' } = {}) {
  const localDb = db ?? openSqlite();
  const studentRepo = new StudentRepository(localDb);
  const userRepo = new UserRepository(localDb);

  const existing = studentRepo.list({ limit: 1, offset: 0 });
  if (existing.length && !force) {
    logger.info('Skipping demo students seed (students already exist). Use --force to override.');
    return { skipped: true };
  }

  if (force) {
    localDb.exec('DELETE FROM students;');
  }

  const parent = userRepo.getByUsername('parent1');
  const guardian_user_id = parent?.id ?? null;

  const mkStudent = (s) =>
    studentRepo.create({
      id: crypto.randomUUID(),
      admission_no: s.admission_no,
      first_name: s.first_name,
      last_name: s.last_name,
      gender: s.gender,
      dob: s.dob,
      class_name: s.class_name,
      guardian_name: s.guardian_name,
      guardian_phone: s.guardian_phone,
      guardian_user_id
    });

  const students = [];
  students.push(
    mkStudent({
      admission_no: 'ZPS-0001',
      first_name: 'Amina',
      last_name: 'Otieno',
      gender: 'F',
      dob: '2015-03-14',
      class_name: className,
      guardian_name: 'Mary Achieng',
      guardian_phone: '+254700000021'
    })
  );
  students.push(
    mkStudent({
      admission_no: 'ZPS-0002',
      first_name: 'Kevin',
      last_name: 'Mwangi',
      gender: 'M',
      dob: '2015-11-02',
      class_name: className,
      guardian_name: 'John Mwangi',
      guardian_phone: '+254700000022'
    })
  );
  students.push(
    mkStudent({
      admission_no: 'ZPS-0003',
      first_name: 'Hassan',
      last_name: 'Ali',
      gender: 'M',
      dob: '2016-01-19',
      class_name: className,
      guardian_name: 'Fatuma Ali',
      guardian_phone: '+254700000023'
    })
  );

  logger.info('Seeded demo students', { count: students.length, guardian_user_id });
  return { skipped: false, students };
}

if (process.argv[1]?.endsWith('demo_students.js')) {
  const args = parseArgs(process.argv.slice(2));
  seedDemoStudents({ force: args.force, className: args.className });
}

