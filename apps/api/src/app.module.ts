// [SHARED, small additive edits only] — each person adds their own module
// to the `imports` array in a one-line PR; nothing else here should change
// often.

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './common/config/config.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditLoggingInterceptor } from './common/interceptors/audit-logging.interceptor';
import { AuditEventEntity } from './modules/audit/entities/audit-event.entity';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentEntity } from './modules/user/entities/student.entity';
import { UserEntity } from './modules/user/entities/user.entity';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule, // validated env, isGlobal

    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [UserEntity, StudentEntity, AuditEventEntity],
        // Phase 1 dev convenience only — migrations own schema changes from
        // here on; synchronize is switched off as soon as the first
        // migration exists so nobody's local DB silently drifts.
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL')! * 1000,
          limit: config.get<number>('THROTTLE_LIMIT')!,
        },
      ],
    }),

    AuditModule, // @Global — exports AuditService for B and C
    AuthModule,
    UserModule,

    // Person B adds: ExamModule, QuestionModule here.
    // Person C adds: AttemptModule, AnswerModule here.
  ],
  providers: [
    // Rate limiting on every route by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Every controller requires a valid JWT unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Every controller enforces @Roles() where present.
    { provide: APP_GUARD, useClass: RolesGuard },
    // Auto-fires AuditService.logEvent() for handlers tagged @AuditLog(type).
    { provide: APP_INTERCEPTOR, useClass: AuditLoggingInterceptor },
  ],
})
export class AppModule {}
