import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from '../employee.controller';
import { EmployeeService } from '../employee.service';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guards';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateUserDto } from 'src/modules/users/dtos/create-user.dto';

describe('EmployeeController', () => {
  let controller: EmployeeController;

  const mockEmployeeService = {
    createEmployee: jest.fn(),
    findAllEmployees: jest.fn(),
    findOneEmployeeById: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
  };

  const mockAdmin: User = {
    id: 'admin-id',
    email: 'admin@company.com',
    role: UserRole.ADMIN,
  } as User;

  const mockEmployee: User = {
    id: 'employee-id',
    email: 'john@company.com',
    role: UserRole.EMPLOYEE,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should allow admin to create employees', async () => {
      const createDto: CreateUserDto = { firstName: 'John', lastName: 'Doe', email: 'new@company.com', password: 'Pass123!' };
      mockEmployeeService.createEmployee.mockResolvedValue(mockEmployee);

      const result = await controller.create(createDto, mockAdmin);

      expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(
        createDto,
        mockAdmin.id,
      );
      expect(result).toBe(mockEmployee);
    });

    it('should prevent managers from creating non-employees', async () => {
      const manager = { ...mockAdmin, role: UserRole.MANAGER };
      const adminCreateDto = { ...mockEmployee, role: UserRole.ADMIN };

      await expect(controller.create(adminCreateDto, manager as User))
        .rejects.toThrow('Managers can only create employees');
    });
  });

  describe('findAll', () => {
    it('should return paginated employees for admins', async () => {
      const expected = { data: [mockEmployee], meta: { total: 1 } };
      mockEmployeeService.findAllEmployees.mockResolvedValue(expected);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toBe(expected);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      mockEmployeeService.findOneEmployeeById.mockResolvedValue(mockEmployee);

      const result = await controller.getProfile(mockEmployee);

      expect(result).toBe(mockEmployee);
    });
  });

  describe('update', () => {
    it('should allow employees to update own profile', async () => {
      mockEmployeeService.updateEmployee.mockResolvedValue(mockEmployee);

      const result = await controller.update(
        'employee-id',
        { firstName: 'Updated' },
        mockEmployee,
      );

      expect(result).toBe(mockEmployee);
    });

    it('should allow admins to update any employee', async () => {
      mockEmployeeService.updateEmployee.mockResolvedValue(mockEmployee);

      const result = await controller.update(
        'employee-id',
        { firstName: 'Updated' },
        mockAdmin,
      );

      expect(result).toBe(mockEmployee);
    });
  });

  describe('remove', () => {
    it('should allow admin to delete employee', async () => {
      mockEmployeeService.deleteEmployee.mockResolvedValue(undefined);

      await controller.remove('employee-id');

      expect(mockEmployeeService.deleteEmployee).toHaveBeenCalledWith(
        'employee-id',
      );
    });
  });
});