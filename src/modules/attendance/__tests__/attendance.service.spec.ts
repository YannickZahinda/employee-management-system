import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AttendanceService } from '../attendance.service';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import { EmailService } from 'src/modules/queue/services/email.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: Repository<Attendance>;
  let userRepo: Repository<User>;
  let emailService: EmailService;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'employee@test.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed',
    employeeIdentifier: 'EMP001',
    phoneNumber: '+1234567890',
    role: UserRole.EMPLOYEE,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    refreshToken: null as any,
    refreshTokenExpiresAt: null as any,
    passwordResetToken: null as any,
    passwordResetExpiresAt: null as any,
    lastLoginAt: null as any,
    attendances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmailService = {
    queueAttendanceEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockAttendance: Partial<Attendance> = {
    id: 'attendance-123',
    date: new Date('2024-01-01'),
    clockIn: '09:00:00',
    clockOut: null as any,
    status: AttendanceStatus.PRESENT,
    notes: null as any,
    employee: mockUser as any,
    employeeId: mockUser.id,
    isEmailSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepo = module.get(getRepositoryToken(Attendance));
    userRepo = module.get(getRepositoryToken(User));
    emailService = module.get(EmailService);
  });

  describe('clockIn', () => {
    it('should create new attendance when employee clocks in', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(attendanceRepo, 'create').mockReturnValue(mockAttendance as Attendance);
      jest.spyOn(attendanceRepo, 'save').mockResolvedValue(mockAttendance as Attendance);

      const result = await service.clockIn(mockUser.id ? mockUser.id : '', { time: '09:00:00' });

      expect(result.clockIn).toBe('09:00:00');
      expect(result.status).toBe('present');
      expect(emailService.queueAttendanceEmail).toHaveBeenCalledWith(
        result,
        mockUser,
      );
    });

    it('should update existing attendance when employee clocks in again', async () => {
      const existingAttendance: Partial<Attendance> = {
        ...mockAttendance,
        clockIn: '08:30:00',
      };

      const updatedAttendance: Partial<Attendance> = {
        ...existingAttendance,
        clockIn: '09:15:00',
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(existingAttendance as Attendance);
      jest.spyOn(attendanceRepo, 'save').mockResolvedValue(updatedAttendance as Attendance);

      const result = await service.clockIn(mockUser.id ? mockUser.id : '', { time: '09:15:00' });

      expect(result.clockIn).toBe('09:15:00');
    });

    it('should throw error when employee not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.clockIn('invalid-id', { time: '09:00:00' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark as late when clocking in after 9:30', async () => {
      const lateAttendance: Partial<Attendance> = {
        ...mockAttendance,
        clockIn: '09:45:00',
        status: AttendanceStatus.LATE,
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(attendanceRepo, 'create').mockReturnValue(lateAttendance as Attendance);
      jest.spyOn(attendanceRepo, 'save').mockResolvedValue(lateAttendance as Attendance);

      const result = await service.clockIn(mockUser.id ? mockUser.id : '', { time: '09:45:00' });

      expect(result.status).toBe('late');
    });

    it('should mark as present when clocking in before 9:30', async () => {
      const earlyAttendance: Partial<Attendance> = {
        ...mockAttendance,
        clockIn: '08:45:00',
        status: AttendanceStatus.PRESENT,
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(attendanceRepo, 'create').mockReturnValue(earlyAttendance as Attendance);
      jest.spyOn(attendanceRepo, 'save').mockResolvedValue(earlyAttendance as Attendance);

      const result = await service.clockIn(mockUser.id ? mockUser.id : '', { time: '08:45:00' });

      expect(result.status).toBe('present');
    });
  });

  describe('clockOut', () => {
    it('should update clock out time', async () => {
      const existingAttendance: Partial<Attendance> = {
        ...mockAttendance,
        clockOut: null as any,
      };

      const updatedAttendance: Partial<Attendance> = {
        ...existingAttendance,
        clockOut: '17:00:00',
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(existingAttendance as Attendance);
      jest.spyOn(attendanceRepo, 'save').mockResolvedValue(updatedAttendance as Attendance);

      const result = await service.clockOut(mockUser.id ? mockUser.id : '', { time: '17:00:00' });

      expect(result.clockOut).toBe('17:00:00');
    });

    it('should throw error when no clock in recorded', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.clockOut(mockUser.id ? mockUser.id : '', { time: '17:00:00' })
      ).rejects.toThrow(NotFoundException);
    });
  });
});