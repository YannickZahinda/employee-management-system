import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../attendance.controller';
import { AttendanceService } from '../attendance.service';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guards';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockEmployee: User = {
    id: 'emp-123',
    email: 'employee@test.com',
    role: UserRole.EMPLOYEE,
  } as User;

  const mockAttendance: Partial<Attendance> = {
    id: 'att-123',
    clockIn: '09:00:00',
    clockOut: null as any,
    employeeId: 'emp-123',
    date: new Date(),
    status: AttendanceStatus.PRESENT
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            clockIn: jest.fn(),
            clockOut: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('clockIn', () => {
    it('should call service.clockIn with correct parameters', async () => {
      const clockInDto = { time: '09:00:00' };
      jest.spyOn(service, 'clockIn').mockResolvedValue(mockAttendance as Attendance);

      const result = await controller.clockIn(mockEmployee, clockInDto);

      expect(service.clockIn).toHaveBeenCalledWith(mockEmployee.id, clockInDto);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('clockOut', () => {
    it('should call service.clockOut with correct parameters', async () => {
      const clockOutDto = { time: '17:00:00' };
      const updatedAttendance = { ...mockAttendance, clockOut: '17:00:00' };
      
      jest.spyOn(service, 'clockOut').mockResolvedValue(updatedAttendance as Attendance);

      const result = await controller.clockOut(mockEmployee, clockOutDto);

      expect(service.clockOut).toHaveBeenCalledWith(mockEmployee.id, clockOutDto);
      expect(result.clockOut).toBe('17:00:00');
    });
  });
});