// [SHARED] Used only by the `typeorm` CLI (migration:generate/run/revert).
// The running app itself configures TypeORM via app.module.ts, not this file.

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AuditEventEntity } from '../modules/audit/entities/audit-event.entity';
import { StudentEntity } from '../modules/user/entities/student.entity';
import { UserEntity } from '../modules/user/entities/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [UserEntity, StudentEntity, AuditEventEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
