import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { jsPDF } from 'jspdf';
import * as ExcelJS from 'exceljs';
import {
  Attendance,
  AttendanceStatus,
} from '../../attendance/entities/attendance.entity';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import {
  GenerateReportDto,
  ReportFormat,
  ReportType,
} from '../dto/generate-report.dto';
import {
  AttendanceReportData,
  ReportResponse,
} from '../interfaces/report-data.interface';
import { WinstonLogger } from '../../../shared/logger/winston.logger';
import autoTable from 'jspdf-autotable';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private logger: WinstonLogger,
  ) {}

  async generateAttendanceReport(
    reportDto: GenerateReportDto,
    requestedBy: User,
  ): Promise<ReportResponse> {
    // Get report data based on type
    const reportData = await this.getReportData(reportDto);

    // Generate report based on format
    switch (reportDto.format) {
      case ReportFormat.PDF:
        return this.generatePdfReport(reportData, reportDto);
      case ReportFormat.EXCEL:
        return this.generateExcelReport(reportData, reportDto);
      default:
        return this.generatePdfReport(reportData, reportDto);
    }
  }

  private async getReportData(
    reportDto: GenerateReportDto,
  ): Promise<AttendanceReportData> {
    let startDate: Date;
    let endDate: Date;
    let reportType: string;

    // Initialize with today as default
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Calculate date range based on report type
    switch (reportDto.type) {
      case ReportType.DAILY:
        const targetDate = reportDto.date
          ? new Date(reportDto.date)
          : new Date();
        targetDate.setHours(0, 0, 0, 0);

        startDate = new Date(targetDate);
        endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        reportType = `Daily Attendance Report - ${targetDate.toDateString()}`;
        break;

      case ReportType.WEEKLY:
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        startDate = new Date(weekStart);
        startDate.setDate(weekStart.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        reportType = `Weekly Attendance Report - Week ${this.getWeekNumber(today)} of ${today.getFullYear()}`;
        break;

      case ReportType.MONTHLY:
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const monthName = now.toLocaleString('default', { month: 'long' });
        reportType = `Monthly Attendance Report - ${monthName} ${now.getFullYear()}`;
        break;

      case ReportType.CUSTOM:
        startDate = reportDto.startDate ? new Date(reportDto.startDate) : today;
        endDate = reportDto.endDate ? new Date(reportDto.endDate) : tomorrow;

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        reportType = `Custom Attendance Report - ${startDate.toDateString()} to ${endDate.toDateString()}`;
        break;

      default:
        // Fallback to daily report
        startDate = today;
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        reportType = `Daily Attendance Report - ${today.toDateString()}`;
    }

    if (isNaN(startDate.getTime())) {
      startDate = today;
    }

    if (isNaN(endDate.getTime())) {
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    }

    const attendances = await this.attendanceRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['employee'],
      order: {
        date: 'DESC',
        employee: {
          lastName: 'ASC',
          firstName: 'ASC',
        },
      },
    });

    // Calculate summary statistics
    const summary = this.calculateSummary(attendances, startDate, endDate);

    return {
      attendances,
      summary,
      generatedAt: new Date(),
      reportType,
    };
  }

  private calculateSummary(
    attendances: Attendance[],
    startDate: Date,
    endDate: Date,
  ) {
    const statusCount = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LATE]: 0,
      [AttendanceStatus.LEAVE]: 0,
    };

    let totalWorkingHours = 0;
    const employeeSet = new Set<string>();

    attendances.forEach((attendance) => {
      statusCount[attendance.status]++;
      employeeSet.add(attendance.employeeId);
      totalWorkingHours += attendance.workingHours || 0;
    });

    return {
      totalEmployees: employeeSet.size,
      totalPresent: statusCount[AttendanceStatus.PRESENT],
      totalAbsent: statusCount[AttendanceStatus.ABSENT],
      totalLate: statusCount[AttendanceStatus.LATE],
      totalLeave: statusCount[AttendanceStatus.LEAVE],
      averageWorkingHours:
        employeeSet.size > 0 ? totalWorkingHours / employeeSet.size : 0,
      dateRange: { start: startDate, end: endDate },
    };
  }

  private generatePdfReport(
    reportData: AttendanceReportData,
    reportDto: GenerateReportDto,
  ): ReportResponse {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.reportType, 20, 20);

    // Add generation date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${reportData.generatedAt.toLocaleString()}`, 20, 30);

    // Add summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 55;

    const summary = reportData.summary;
    doc.text(`Total Employees: ${summary.totalEmployees}`, 20, yPos);
    yPos += 7;
    doc.text(`Present: ${summary.totalPresent}`, 20, yPos);
    doc.text(`Absent: ${summary.totalAbsent}`, 70, yPos);
    doc.text(`Late: ${summary.totalLate}`, 120, yPos);
    doc.text(`Leave: ${summary.totalLeave}`, 170, yPos);
    yPos += 7;
    doc.text(
      `Average Working Hours: ${summary.averageWorkingHours.toFixed(2)}`,
      20,
      yPos,
    );
    yPos += 7;
    doc.text(
      `Date Range: ${summary.dateRange.start.toDateString()} to ${summary.dateRange.end.toDateString()}`,
      20,
      yPos,
    );

    // Add attendance table header
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Details', 20, yPos);

    yPos += 10;
    this.drawTableHeader(doc, yPos);

    // Add attendance data rows
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    reportData.attendances.forEach((attendance, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        this.drawTableHeader(doc, yPos);
        yPos += 7;
      }

      const row = [
        (index + 1).toString(),
        attendance.employee.employeeIdentifier || 'N/A',
        `${attendance.employee.firstName} ${attendance.employee.lastName}`,
        new Date(attendance.date).toDateString(), 
        attendance.clockIn || 'N/A',
        attendance.clockOut || 'N/A',
        attendance.status,
        (attendance.workingHours || 0).toFixed(2),
        attendance.isLate ? 'Yes' : 'No',
      ];

      this.drawTableRow(doc, row, yPos);
      yPos += 7;
    });

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Employee Management System - Confidential', 20, 280);
    doc.text(`Page ${doc.getNumberOfPages()}`, 270, 280);

    const buffer = Buffer.from(doc.output('arraybuffer'));

    return {
      filename: `attendance-report-${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf',
      size: buffer.length,
    };
  }

  private drawTableHeader(doc: jsPDF, yPos: number): void {
    const headers = [
      '#',
      'Emp ID',
      'Employee',
      'Date',
      'Clock In',
      'Clock Out',
      'Status',
      'Hours',
      'Late',
    ];
    const columnWidths = [10, 25, 50, 35, 25, 25, 25, 20, 15];
    let xPos = 20;

    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      doc.rect(xPos, yPos - 5, columnWidths[index], 7, 'F');
      doc.text(header, xPos + 2, yPos);
      xPos += columnWidths[index];
    });

    doc.setTextColor(0, 0, 0);
  }

  private drawTableRow(doc: jsPDF, row: string[], yPos: number): void {
    const columnWidths = [10, 25, 50, 35, 25, 25, 25, 20, 15];
    let xPos = 20;

    row.forEach((cell, index) => {
      doc.text(cell, xPos + 2, yPos);
      xPos += columnWidths[index];
    });
  }

  private async generateExcelReport(
    reportData: AttendanceReportData,
    reportDto: GenerateReportDto,
  ): Promise<ReportResponse> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Employee Management System';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = reportData.reportType;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.getCell('A2').value = 'Generated';
    summarySheet.getCell('B2').value = reportData.generatedAt.toLocaleString();
    summarySheet.getCell('A2').font = { bold: true };

    const summary = reportData.summary;
    const summaryData = [
      ['Total Employees', summary.totalEmployees],
      ['Present', summary.totalPresent],
      ['Absent', summary.totalAbsent],
      ['Late', summary.totalLate],
      ['Leave', summary.totalLeave],
      ['Average Working Hours', summary.averageWorkingHours.toFixed(2)],
      ['Start Date', summary.dateRange.start.toDateString()],
      ['End Date', summary.dateRange.end.toDateString()],
    ];

    summarySheet.addRows(summaryData);

    // Style summary sheet
    summarySheet.columns = [{ width: 25 }, { width: 20 }];

    // Create Attendance Details Sheet
    const attendanceSheet = workbook.addWorksheet('Attendance Details');

    // Add headers
    attendanceSheet.columns = [
      { header: '#', width: 5 },
      { header: 'Employee ID', width: 15 },
      { header: 'Employee Name', width: 25 },
      { header: 'Date', width: 15 },
      { header: 'Clock In', width: 15 },
      { header: 'Clock Out', width: 15 },
      { header: 'Status', width: 15 },
      { header: 'Working Hours', width: 15 },
      { header: 'Late', width: 10 },
      { header: 'Notes', width: 30 },
    ];

    // Style headers
    attendanceSheet.getRow(1).font = { bold: true };
    attendanceSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    attendanceSheet.getRow(1).alignment = { horizontal: 'center' };

    reportData.attendances.forEach((attendance, index) => {
      const row = attendanceSheet.addRow([
        index + 1,
        attendance.employee.employeeIdentifier || 'N/A',
        `${attendance.employee.firstName} ${attendance.employee.lastName}`,
        new Date(attendance.date).toDateString(),
        attendance.clockIn || 'N/A',
        attendance.clockOut || 'N/A',
        attendance.status,
        (attendance.workingHours || 0).toFixed(2),
        attendance.isLate ? 'Yes' : 'No',
        attendance.notes || '',
      ]);

      let color = 'FFFFFF';
      switch (attendance.status) {
        case AttendanceStatus.PRESENT:
          color = 'C6EFCE'; 
          break;
        case AttendanceStatus.LATE:
          color = 'FFEB9C'; 
          break;
        case AttendanceStatus.ABSENT:
          color = 'FFC7CE'; 
          break;
        case AttendanceStatus.LEAVE:
          color = 'D9E1F2'; 
          break;
      }

      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    });

    attendanceSheet.getColumn(8).numFmt = '0.00';

    const bufferPromise = workbook.xlsx.writeBuffer();
    const report = await bufferPromise.then((buffer) => ({
      filename: `attendance-report-${Date.now()}.xlsx`,
      buffer: Buffer.from(buffer),
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.byteLength,
    }));
    return report;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async getEmployeeReport(employeeId: string, month: number, year: number) {
    const employee = await this.userRepository.findOne({
      where: { id: employeeId, isActive: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendances = await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    return {
      employee,
      attendances,
      month: startDate.toLocaleString('default', { month: 'long' }),
      year,
      summary: this.calculateSummary(attendances, startDate, endDate),
    };
  }
}
