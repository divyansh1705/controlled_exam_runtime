// Owner: Person A (Identity/Auth/Security)

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditEvent1725000000001 implements MigrationInterface {
  name = 'CreateAuditEvent1725000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "audit_events_type_enum" AS ENUM (
        'LOGIN','LOGIN_FAILED','LOGOUT','TOKEN_REFRESHED',
        'STUDENT_CREATED','STUDENT_UPDATED','STUDENT_BULK_IMPORTED',
        'EXAM_CREATED','EXAM_UPDATED','EXAM_STATUS_CHANGED','EXAM_STARTED',
        'ANSWER_SAVED','SUBMITTED','AUTO_SUBMITTED','SECURITY_CHECK_FAILED'
      )`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_events',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'type', type: 'audit_events_type_enum' },
          { name: 'actorId', type: 'uuid', isNullable: true },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'ipAddress', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'audit_events',
      new TableIndex({ name: 'IDX_audit_events_type', columnNames: ['type'] }),
    );
    await queryRunner.createIndex(
      'audit_events',
      new TableIndex({ name: 'IDX_audit_events_actorId', columnNames: ['actorId'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_events', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_events_type_enum"`);
  }
}
