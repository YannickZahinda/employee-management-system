import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/role.decorators';
import { UserRole } from '../users/entity/user.schema';
import { CurrentUser } from '../../common/decorators/api.decorators';
import { User } from '../users/entity/user.schema';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in for the day' })
  @ApiResponse({ status: 201, description: 'Clocked in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time format' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async clockIn(
    @CurrentUser() user: User,
    @Body() clockInDto: ClockInDto,
  ) {
    // Check if user is an employee (not admin)
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admins cannot clock in');
    }

    return await this.attendanceService.clockIn(user.id, clockInDto);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out for the day' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time format' })
  @ApiResponse({ status: 404, description: 'Employee not found or no clock-in recorded' })
  async clockOut(
    @CurrentUser() user: User,
    @Body() clockOutDto: ClockOutDto,
  ) {
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admins cannot clock out');
    }

    return await this.attendanceService.clockOut(user.id, clockOutDto);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s attendance for current user' })
  @ApiResponse({ status: 200, description: 'Attendance retrieved successfully' })
  async getTodayAttendance(@CurrentUser() user: User) {
    return await this.attendanceService.getAttendance(user.id, new Date());
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get attendance records for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  async getEmployeeAttendance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    
    return await this.attendanceService.getEmployeeAttendance(employeeId, fromDate, toDate);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all attendance records (admins/managers only)' })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'All attendance records retrieved' })
  async getAllAttendances(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    
    return await this.attendanceService.getAllAttendances(fromDate, toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record retrieved' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async getAttendanceById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.attendanceService.getAttendanceById(id);
  }
}