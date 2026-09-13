// Owner: Person A (Identity/Auth/Security)

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BulkImportStudentsDto,
  CreateStudentDto,
  UpdateStudentDto,
} from '@secure-exam/validation';
import { Role } from '@secure-exam/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from './user.service';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.listStudents();
  }

  @Post()
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: { sub: string }) {
    return this.userService.createStudent(dto, user.sub);
  }

  @Post('bulk-import')
  bulkImport(
    @Body() dto: BulkImportStudentsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.userService.bulkImportStudents(dto.students, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.userService.updateStudent(id, dto, user.sub);
  }
}
