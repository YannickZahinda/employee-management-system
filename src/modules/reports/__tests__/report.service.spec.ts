import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportService } from '../services/report.service';
import { Attendance, AttendanceStatus } from '../../attendance/entities/attendance.entity';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import { WinstonLogger } from '../../../shared/logger/winston.logger';
import {
  GenerateReportDto,
  ReportFormat,
  ReportType,
} from '../dto/generate-report.dto';

describe('ReportService', () => {
  let service: ReportService;
  let attendanceRepo: Repository<Attendance>;
  let userRepo: Repository<User>;
  let logger: WinstonLogger;

  // Mock data
  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@company.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed',
    employeeIdentifier: 'EMP001',
    phoneNumber: '+1234567890',
    role: UserRole.EMPLOYEE,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    refreshToken: null,
    refreshTokenExpiresAt: null, 
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    attendances: [],
  };

  const mockAttendance: Attendance = {
    id: 'attendance-123',
    date: new Date(),
    clockIn: '09:00:00',
    clockOut: '17:00:00',
    status: AttendanceStatus.PRESENT,
    notes: '',
    employeeId: 'user-123',
    isEmailSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: mockUser as User,
    workingHours: 8,
    isLate: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: {
            find: jest.fn().mockResolvedValue([mockAttendance]),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
            count: jest.fn().mockResolvedValue(10),
          },
        },
        {
          provide: WinstonLogger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    attendanceRepo = module.get<Repository<Attendance>>(
      getRepositoryToken(Attendance),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    logger = module.get<WinstonLogger>(WinstonLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAttendanceReport', () => {
    it('should generate PDF report', async () => {
      const reportDto: GenerateReportDto = {
        format: ReportFormat.PDF,
        type: ReportType.DAILY,
      };

      const result = await service.generateAttendanceReport(
        reportDto,
        mockUser as User,
      );

      expect(result).toBeDefined();
      expect(result.filename).toContain('.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should generate Excel report', async () => {
      const reportDto: GenerateReportDto = {
        format: ReportFormat.EXCEL,
        type: ReportType.DAILY,
      };

      const result = await service.generateAttendanceReport(
        reportDto,
        mockUser as User,
      );

      expect(result).toBeDefined();
      expect(result.filename).toContain('.xlsx');
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle custom date range', async () => {
      const reportDto: GenerateReportDto = {
        format: ReportFormat.PDF,
        type: ReportType.CUSTOM,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const result = await service.generateAttendanceReport(
        reportDto,
        mockUser as User,
      );

      expect(result).toBeDefined();
      expect(result.filename).toContain('.pdf');
    });

    it('should default to PDF when no format specified', async () => {
      const reportDto: GenerateReportDto = {
        type: ReportType.DAILY,
      } as any;

      const result = await service.generateAttendanceReport(
        reportDto,
        mockUser as User,
      );

      expect(result.mimeType).toBe('application/pdf');
    });
  });

  describe('getEmployeeReport', () => {
    it('should return employee monthly report', async () => {
      const result = await service.getEmployeeReport('user-123', 1, 2024);

      expect(result).toBeDefined();
      expect(result.employee).toEqual(mockUser);
      expect(result.attendances).toBeDefined();
      expect(result.month).toBe('January');
      expect(result.year).toBe(2024);
      expect(result.summary).toBeDefined();
    });

    it('should throw NotFoundException for invalid employee', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.getEmployeeReport('invalid-id', 1, 2024),
      ).rejects.toThrow('Employee with ID invalid-id not found');
    });
  });
});
