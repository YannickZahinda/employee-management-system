import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { User } from '../users/entity/user.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { LoggerModule } from '../../shared/logger/logger.module';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Attendance]),
    LoggerModule,
    BullModule.registerQueue({
      name: 'email',
    }),
    UsersModule,
    QueueModule
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
