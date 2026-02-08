import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Res,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from '../services/report.service';
import { GenerateReportDto, ReportFormat, ReportType } from '../dto/generate-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guards';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorators';
import { UserRole } from 'src/common/decorators/api.decorators';
import { CurrentUser } from 'src/common/decorators/api.decorators';
import { User } from 'src/modules/users/entity/user.entity';
import { AttendanceStatus } from 'src/modules/attendance/entities/attendance.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('attendance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate attendance report (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async generateAttendanceReport(
    @Body() generateReportDto: GenerateReportDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const report = await this.reportService.generateAttendanceReport(
      generateReportDto,
      user,
    );

    res.setHeader('Content-Type', report.mimeType);
    res.setHeader('Content-Length', report.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );

    res.send(report.buffer);
  }

  @Get('attendance/pdf')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate PDF attendance report (Admin/Manager only)' })
  @ApiQuery({ name: 'date', required: false, description: 'Specific date (ISO string)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for custom range' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for custom range' })
  @ApiProduces('application/pdf')
  async generatePdfReport(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: User,
    @Res() res?: Response,
  ) {
    const reportDto: GenerateReportDto = {
      format: ReportFormat.PDF,
      type: date ? ReportType.DAILY : startDate ? ReportType.CUSTOM : ReportType.DAILY,
      date,
      startDate,
      endDate,
    };

    const report = await this.reportService.generateAttendanceReport(
      reportDto,
      user!,
    );

    res?.setHeader('Content-Type', report.mimeType);
    res?.setHeader('Content-Length', report.size);
    res?.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );

    res?.send(report.buffer);
  }

  @Get('attendance/excel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate Excel attendance report (Admin/Manager only)' })
  @ApiQuery({ name: 'date', required: false, description: 'Specific date (ISO string)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for custom range' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for custom range' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async generateExcelReport(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: User,
    @Res() res?: Response,
  ) {
    const reportDto: GenerateReportDto = {
      format: ReportFormat.EXCEL,
      type: date ? ReportType.DAILY : startDate ? ReportType.CUSTOM : ReportType.DAILY,
      date,
      startDate,
      endDate,
    };

    const report = await this.reportService.generateAttendanceReport(
      reportDto,
      user!,
    );

    res?.setHeader('Content-Type', report.mimeType);
    res?.setHeader('Content-Length', report.size);
    res?.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );

    res?.send(report.buffer);
  }

  @Get('employee/:employeeId/monthly/:year/:month')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get monthly report for specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({ name: 'year', description: 'Year (e.g., 2024)' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiResponse({ status: 200, description: 'Monthly report retrieved' })
  async getEmployeeMonthlyReport(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @CurrentUser() user: User,
  ) {
    return await this.reportService.getEmployeeReport(employeeId, month, year);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboardData(@CurrentUser() user: User) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance
    const todaysAttendance = await this.reportService['attendanceRepository'].find({
      where: {
        date: today,
      },
      relations: ['employee'],
    });

    // Calculate stats
    const totalEmployees = await this.reportService['userRepository'].count({
      where: { isActive: true, role: UserRole.EMPLOYEE },
    });

    const presentToday = todaysAttendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE,
    ).length;

    const lateToday = todaysAttendance.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    const absentToday = todaysAttendance.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;

    return {
      date: today.toDateString(),
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate: totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0,
      todaysAttendance: todaysAttendance.slice(0, 10), // Last 10 records
    };
  }
}