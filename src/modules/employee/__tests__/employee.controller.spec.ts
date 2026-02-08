import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from '../employee.controller';
import { EmployeeService } from '../employee.service';
import { CreateUserDto } from 'src/modules/users/dtos/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dtos/update-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guards';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let employeeService: EmployeeService;

  const mockEmployeeService = {
    createEmployee: jest.fn(),
    findAllEmployees: jest.fn(),
    findOneEmployeeById: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
    getEmployeeAttendanceSummary: jest.fn(),
  };

  const mockAdminUser: Partial<User> = {
    id: 'admin-id',
    email: 'admin@company.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'hashed',
    employeeIdentifier: 'ADMIN001',
    phoneNumber: '+1234567890',
    role: UserRole.ADMIN,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    refreshToken: null as any,
    refreshTokenExpiresAt: null as any,
    passwordResetToken: null as any,
    passwordResetExpiresAt: null as any,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    attendances: [],
    validatePassword: jest.fn(),
  };

  const mockEmployeeUser: Partial<User> = {
    id: 'employee-id',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed',
    employeeIdentifier: 'EMP001',
    phoneNumber: '+1234567891',
    role: UserRole.EMPLOYEE,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    refreshToken: null as any,
    refreshTokenExpiresAt: null as any,
    passwordResetToken: null as any,
    passwordResetExpiresAt: null as any,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    attendances: [],
    validatePassword: jest.fn(),
  };

  // Mock Guards
  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => true,
  };

  const mockRolesGuard = {
    canActivate: (context: ExecutionContext) => true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
    employeeService = module.get<EmployeeService>(EmployeeService);

    jest.clearAllMocks();
  });

  describe('POST /employees', () => {
    const createUserDto: CreateUserDto = {
      email: 'new.employee@company.com',
      firstName: 'New',
      lastName: 'Employee',
      password: 'Password123!',
      phoneNumber: '+1234567892',
      role: UserRole.EMPLOYEE,
    };

    it('should create employee successfully (admin)', async () => {
      
      mockEmployeeService.createEmployee.mockResolvedValue(mockEmployeeUser);

      // Act
      const result = await controller.create(createUserDto, mockAdminUser as User);

      
      expect(employeeService.createEmployee).toHaveBeenCalledWith(
        createUserDto,
        mockAdminUser.id,
      );
      expect(result).toEqual(mockEmployeeUser);
    });

    it('should create employee successfully (manager)', async () => {
      
      const managerUser = { ...mockAdminUser, role: UserRole.MANAGER };
      mockEmployeeService.createEmployee.mockResolvedValue(mockEmployeeUser);

      // Act
      const result = await controller.create(createUserDto, managerUser as User);

      
      expect(employeeService.createEmployee).toHaveBeenCalled();
      expect(result).toEqual(mockEmployeeUser);
    });

    it('should prevent manager from creating non-employee roles', async () => {
      
      const managerUser = { ...mockAdminUser, role: UserRole.MANAGER };
      const adminCreateDto = { ...createUserDto, role: UserRole.ADMIN };

      // Act & Assert
      await expect(controller.create(adminCreateDto, managerUser as User))
        .rejects.toThrow(ForbiddenException);
      await expect(controller.create(adminCreateDto, managerUser as User))
        .rejects.toThrow('Managers can only create employees');
    });

    it('should allow admin to create any role', async () => {
      
      const managerCreateDto = { ...createUserDto, role: UserRole.MANAGER };
      mockEmployeeService.createEmployee.mockResolvedValue({
        ...mockEmployeeUser,
        role: UserRole.MANAGER,
      });

      // Act
      const result = await controller.create(managerCreateDto, mockAdminUser as User);

      
      expect(result.role).toBe(UserRole.MANAGER);
    });
  });

  describe('GET /employees', () => {
    it('should return paginated employees (admin)', async () => {
      
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const expectedResponse = {
        data: [mockEmployeeUser, mockAdminUser],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };
      mockEmployeeService.findAllEmployees.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.findAll(paginationDto);

      
      expect(employeeService.findAllEmployees).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle search parameter', async () => {
      
      const paginationDto: PaginationDto = { page: 1, limit: 10, search: 'john' };
      const expectedResponse = {
        data: [mockEmployeeUser],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockEmployeeService.findAllEmployees.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.findAll(paginationDto);

      
      expect(employeeService.findAllEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' }),
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /employees/me', () => {
    it('should return current user profile', async () => {
      
      mockEmployeeService.findOneEmployeeById.mockResolvedValue(mockEmployeeUser);

      const result = await controller.getProfile(mockEmployeeUser as User);

      
      expect(employeeService.findOneEmployeeById).toHaveBeenCalledWith(mockEmployeeUser.id);
      expect(result).toEqual(mockEmployeeUser);
    });
  });

  describe('GET /employees/:id', () => {
    it('should return employee by id (admin)', async () => {
      
      mockEmployeeService.findOneEmployeeById.mockResolvedValue(mockEmployeeUser);

      // Act
      const result = await controller.findOne('employee-id');

      
      expect(employeeService.findOneEmployeeById).toHaveBeenCalledWith('employee-id');
      expect(result).toEqual(mockEmployeeUser);
    });
  });

  describe('PATCH /employees/:id', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: '+9876543210',
    };

    it('should allow admin to update employee', async () => {
      
      const updatedEmployee = { ...mockEmployeeUser, ...updateUserDto };
      mockEmployeeService.updateEmployee.mockResolvedValue(updatedEmployee);

      // Act
      const result = await controller.update(
        'employee-id',
        updateUserDto,
        mockAdminUser as User,
      );

      
      expect(employeeService.updateEmployee).toHaveBeenCalledWith(
        'employee-id',
        updateUserDto,
        mockAdminUser,
      );
      expect(result).toEqual(updatedEmployee);
    });

    it('should allow employee to update own profile', async () => {
      
      const updatedEmployee = { ...mockEmployeeUser, ...updateUserDto };
      mockEmployeeService.updateEmployee.mockResolvedValue(updatedEmployee);

      // Act
      const result = await controller.update(
        'employee-id',
        updateUserDto,
        mockEmployeeUser as User,
      );

      
      expect(result).toEqual(updatedEmployee);
    });

    it('should prevent employee from updating others', async () => {
      
      mockEmployeeService.updateEmployee.mockRejectedValue(
        new ForbiddenException('You can only update your own profile'),
      );

      // Act & Assert
      await expect(controller.update(
        'different-employee-id', // Different ID
        updateUserDto,
        mockEmployeeUser as User, // Regular employee
      )).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /employees/:id', () => {
    it('should delete employee (admin only)', async () => {
      
      mockEmployeeService.deleteEmployee.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove('employee-id');

      
      expect(employeeService.deleteEmployee).toHaveBeenCalledWith('employee-id');
      expect(result).toBeUndefined();
    });
  });

});