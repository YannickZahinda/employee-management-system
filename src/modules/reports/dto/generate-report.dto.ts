import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export class GenerateReportDto {
  @ApiProperty({
    enum: ReportFormat,
    default: ReportFormat.PDF,
    description: 'Report format',
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.PDF;

  @ApiProperty({
    enum: ReportType,
    default: ReportType.DAILY,
    description: 'Report type',
  })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType = ReportType.DAILY;

  @ApiProperty({
    description: 'Start date for custom range (ISO string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for custom range (ISO string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Specific date for daily report (ISO string)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Include employee details in report',
    default: true,
    required: false,
  })
  @IsOptional()
  includeEmployeeDetails?: boolean = true;

  @ApiProperty({
    description: 'Include summary statistics',
    default: true,
    required: false,
  })
  @IsOptional()
  includeSummary?: boolean = true;
}