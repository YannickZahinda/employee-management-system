import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';
import { Attendance } from '../attendance/entities/attendance.entity';
import { User } from '../users/entity/user.entity';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User]),
    LoggerModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}