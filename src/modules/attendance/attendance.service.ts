import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { User } from '../users/entity/user.entity';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { EmailService } from '../queue/services/email.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async clockIn(employeeId: string, clockInDto: ClockInDto): Promise<Attendance> {
    const employee = await this.userRepository.findOne({
      where: { id: employeeId, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    const status = this.determineStatus(clockInDto.time);

    if (attendance) {
      // Update existing attendance
      attendance.clockIn = clockInDto.time;
      attendance.status = status;
    } else {
      attendance = this.attendanceRepository.create({
        date: today,
        clockIn: clockInDto.time,
        employeeId,
        status: status,
        employee, // Pass the entity instance
      });
    }

    const savedAttendance = await this.attendanceRepository.save(attendance);

    // Queue email notification
    await this.emailService.queueAttendanceEmail(savedAttendance, employee);

    return savedAttendance;
  }

  async clockOut(employeeId: string, clockOutDto: ClockOutDto): Promise<Attendance> {
    const employee = await this.userRepository.findOne({
      where: { id: employeeId, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    if (!attendance) {
      throw new NotFoundException(`No attendance found for today`);
    }

    attendance.clockOut = clockOutDto.time;
    await this.attendanceRepository.save(attendance);

    return attendance;
  }

  async getAttendance(employeeId: string, date: Date): Promise<Attendance[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      relations: ['employee'],
    });
  }

  async getEmployeeAttendance(employeeId: string, from?: Date, to?: Date): Promise<Attendance[]> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.employeeId = :employeeId', { employeeId });

    if (from && to) {
      queryBuilder.andWhere('attendance.date BETWEEN :from AND :to', { from, to });
    }

    return await queryBuilder.orderBy('attendance.date', 'DESC').getMany();
  }

  async getAttendanceById(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async getAllAttendances(from?: Date, to?: Date): Promise<Attendance[]> {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee');

    if (from && to) {
      queryBuilder.andWhere('attendance.date BETWEEN :from AND :to', { from, to });
    }

    return await queryBuilder.orderBy('attendance.date', 'DESC').getMany();
  }

  private determineStatus(clockInTime: string): AttendanceStatus {
    const [hours, minutes] = clockInTime.split(':').map(Number);
    const checkInTime = new Date(0, 0, 0, hours, minutes);
    const lateThreshold = new Date(0, 0, 0, 9, 30); // 9:30 AM

    return checkInTime > lateThreshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
  }
}