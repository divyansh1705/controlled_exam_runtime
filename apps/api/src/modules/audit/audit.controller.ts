// Owner: Person A (Identity/Auth/Security)
// Person C's admin-portal audit viewer screen calls this endpoint.

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditEventType, Role } from '@secure-exam/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiQuery({
    name: 'type',
    enum: AuditEventType,
    required: false,
    description: 'Filter by event type. Leave empty to return all types.',
  })
  @ApiQuery({
    name: 'actorId',
    required: false,
    description: 'Filter by the user id who performed the action. Leave empty for all actors.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max results to return. Defaults to 50 if omitted.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset. Defaults to 0 if omitted.',
  })
  findAll(
    @Query('type') type?: AuditEventType,
    @Query('actorId') actorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.findAll({
      type,
      actorId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}