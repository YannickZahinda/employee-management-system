import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entity/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { WinstonLogger } from '../../shared/logger/winston.logger';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UpdateUserDto } from '../users/dtos/update-user.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private logger: WinstonLogger,
  ) {}

  async createEmployee(
    createUserDto: CreateUserDto,
    createdByAdminId?: string,
  ): Promise<User> {
    const { email, password, ...rest } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const employee_user = this.userRepository.create({
      ...rest,
      email,
      password,
    });

    await this.userRepository.save(employee_user);

    this.logger.log(
      `Employee created: ${email} by admin ID: ${createdByAdminId}`,
      EmployeeService.name,
    );

    const { password: _, refreshToken: __, ...result } = employee_user;
    return result as User;
  }

  async findAllEmployees(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const whereConditions: any = { isActive: true };

    if (search) {
      whereConditions.email = ILike(`%${search}%`);
    }

    const [employees, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'employeeIdentifier',
        'phoneNumber',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneEmployeeById(id: string): Promise<User> {
    const employee = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'employeeIdentifier',
        'phoneNumber',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async updateEmployee(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const employee = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException(
        'You do not have permission to update this employee',
      );
    }

    //Admin Can Change Role, others cannot
    if (currentUser.role !== UserRole.ADMIN && updateUserDto.role) {
      delete updateUserDto.role;
    }

    Object.assign(employee, updateUserDto);

    const updatedEmployee = await this.userRepository.save(employee);

    this.logger.log(`Employee updated: ${id}`, EmployeeService.name);

    // Return without sensitive data
    const { password, refreshToken, passwordResetToken, ...result } =
      updatedEmployee;
    return result as User;
  }

  // Soft delete employee (admin only)
  async deleteEmployee(id: string): Promise<void> {
    const employee = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    employee.isActive = false;
    await this.userRepository.save(employee);

    this.logger.log(`Employee deactivated: ${id}`, EmployeeService.name);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async getEmployeeAttendance(
    employeeId: string,
    from?: Date,
    to?: Date,
  ): Promise<Attendance[]> {
    const employee = await this.findOneEmployeeById(employeeId);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .orderBy('attendance.date', 'DESC');

    if (from && to) {
      queryBuilder.andWhere('attendance.date BETWEEN :from AND :to', {
        from,
        to,
      });
    } else if (from) {
      queryBuilder.andWhere('attendance.date >= :from', { from });
    } else if (to) {
      queryBuilder.andWhere('attendance.date <= :to', { to });
    }

    return await queryBuilder.getMany();
  }

  // async getEmployeeAttendanceSummary(employeeId: string) {
  //   const employee = await this.findEmployeeById(employeeId);
    
  //   // You would join with attendance records here
  //   // For now, return basic info
  //   return {
  //     employee,
  //     attendanceSummary: {
  //       totalDays: 0,
  //       presentDays: 0,
  //       absentDays: 0,
  //       lateDays: 0,
  //     },
  //   };
  // }
}
