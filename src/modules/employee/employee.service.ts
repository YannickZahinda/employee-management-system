import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entity/user.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { WinstonLogger } from '../../shared/logger/winston.logger';
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private logger: WinstonLogger,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<User> {
    const { email, password, ...rest } = createEmployeeDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      ...rest,
      email,
      password, 
    });

    await this.userRepository.save(user);
    
    this.logger.log(`Employee created: ${email}`, EmployeeService.name);
    
    return user;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<User>> {
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

  async findOne(id: string): Promise<User> {
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

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<User> {
    const employee = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Handle password update if provided
    if (updateEmployeeDto.newPassword) {
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(updateEmployeeDto.newPassword, salt);
    }

    // Update other fields
    Object.assign(employee, updateEmployeeDto);
    
    // Remove newPassword property as it doesn't exist on User entity
    delete (employee as any).newPassword;

    const updatedEmployee = await this.userRepository.save(employee);
    
    this.logger.log(`Employee updated: ${id}`, EmployeeService.name);
    
    // Return without password
    const { password, refreshToken, passwordResetToken, ...result } = updatedEmployee;
    return result as User;
  }

  async remove(id: string): Promise<void> {
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
    const employee = await this.findOne(employeeId);
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .orderBy('attendance.date', 'DESC');

    if (from && to) {
      queryBuilder.andWhere('attendance.date BETWEEN :from AND :to', { from, to });
    } else if (from) {
      queryBuilder.andWhere('attendance.date >= :from', { from });
    } else if (to) {
      queryBuilder.andWhere('attendance.date <= :to', { to });
    }

    return await queryBuilder.getMany();
  }
}