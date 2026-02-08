import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guards';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GenerateReportDto, ReportFormat } from '../dto/generate-report.dto';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  const mockReport = {
    filename: 'report.pdf',
    buffer: Buffer.from('test'),
    mimeType: 'application/pdf',
    size: 100,
  };

  const mockUser = {
    id: 'user-123',
    email: 'admin@company.com',
    role: 'admin',
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: {
            generateAttendanceReport: jest.fn().mockResolvedValue(mockReport),
            getEmployeeReport: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateAttendanceReport', () => {
    it('should generate report and set response headers', async () => {
      const reportDto: GenerateReportDto = {
        format: ReportFormat.PDF,
      };

      await controller.generateAttendanceReport(
        reportDto,
        mockUser as any,
        mockResponse as any,
      );

      expect(service.generateAttendanceReport).toHaveBeenCalledWith(
        reportDto,
        mockUser,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="report.pdf"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockReport.buffer);
    });
  });

  describe('generatePdfReport', () => {
    it('should generate PDF report via GET endpoint', async () => {
      await controller.generatePdfReport(
        '2024-01-15',
        undefined,
        undefined,
        mockUser as any,
        mockResponse as any,
      );

      expect(service.generateAttendanceReport).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
    });
  });

  describe('generateExcelReport', () => {
    it('should generate Excel report via GET endpoint', async () => {
      const excelReport = {
        filename: 'report.xlsx',
        buffer: Buffer.from('excel'),
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 200,
      };

      jest
        .spyOn(service, 'generateAttendanceReport')
        .mockResolvedValueOnce(excelReport as any);

      await controller.generateExcelReport(
        undefined,
        '2024-01-01',
        '2024-01-31',
        mockUser as any,
        mockResponse as any,
      );

      expect(service.generateAttendanceReport).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="report.xlsx"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(excelReport.buffer);
    });
  });

  describe('getEmployeeMonthlyReport', () => {
    it('should return employee monthly report', async () => {
      const result = await controller.getEmployeeMonthlyReport(
        'user-123',
        2024,
        1,
        mockUser as any,
      );

      expect(service.getEmployeeReport).toHaveBeenCalledWith(
        'user-123',
        1,
        2024,
      );
      expect(result).toBeDefined();
    });
  });
});
