// Owner: Person A (Identity/Auth/Security)
// Shared dependency: Person B and Person C's modules call logEvent()
// directly instead of writing ad-hoc console.log or custom log tables.
// This is the real, persisted implementation — during Day 0, B/C can code
// against this same method signature even before migrations are finalized.

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditEventType } from '@secure-exam/types';
import { Repository } from 'typeorm';
import { AuditEventEntity } from './entities/audit-event.entity';

export interface AuditQueryOptions {
  type?: AuditEventType;
  actorId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly auditRepository: Repository<AuditEventEntity>,
  ) {}

  async logEvent(
    type: AuditEventType,
    metadata: Record<string, unknown> = {},
    actorId: string | null = null,
    ipAddress: string | null = null,
  ): Promise<AuditEventEntity> {
    const event = this.auditRepository.create({
      type,
      metadata,
      actorId,
      ipAddress,
    });
    return this.auditRepository.save(event);
  }

  async findAll(options: AuditQueryOptions = {}): Promise<AuditEventEntity[]> {
    const { type, actorId, limit = 50, offset = 0 } = options;
    return this.auditRepository.find({
      where: {
        ...(type ? { type } : {}),
        ...(actorId ? { actorId } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
