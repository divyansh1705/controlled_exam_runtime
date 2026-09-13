// Owner: Person A (Identity/Auth/Security)

import { AuditEventType } from '@secure-exam/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_events')
export class AuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'enum', enum: AuditEventType })
  type!: AuditEventType;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
