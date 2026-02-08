import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

import { CustomConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { QueueModule } from './modules/queue/queue.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guards';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ReportModule } from './modules/reports/report.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './database/seeds/seed.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    CustomConfigModule,
    DatabaseModule,
    LoggerModule,
    QueueModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl = configService.get<number>('config.rateLimit.ttl') || 60;
        const limit =
          configService.get<number>('config.rateLimit.limit') || 100;

        return {
          throttlers: [
            {
              ttl,
              limit,
            },
          ],
        };
      },
    }),

    ScheduleModule.forRoot(),

    EventEmitterModule.forRoot(),

    AuthModule,
    EmployeeModule,
    AttendanceModule,
    ReportModule,
    HealthModule,
    SeedModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationIdMiddleware,
        helmet(),
        compression(),
        cookieParser(),
        express.json({ limit: '10mb' }),
        express.urlencoded({ extended: true, limit: '10mb' }),
      )
      .forRoutes('*');
  }
}
