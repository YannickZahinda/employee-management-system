import { Attendance } from '../../attendance/entities/attendance.entity';
import { User } from 'src/modules/users/entity/user.entity';

export interface AttendanceReportData {
  attendances: (Attendance & { employee: User })[];
  summary: {
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
    averageWorkingHours: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  generatedAt: Date;
  reportType: string;
}

export interface ReportResponse {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}