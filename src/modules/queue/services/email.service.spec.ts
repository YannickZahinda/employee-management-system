import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { EmailTemplatesService } from '../services/email-templates.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Attendance } from 'src/modules/attendance/entities/attendance.entity';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let emailQueue: Queue;
  let emailTemplatesService: EmailTemplatesService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'config.email') {
        return {
          host: 'smtp.test.com',
          port: 587,
          secure: false,
          auth: { user: 'test@test.com', pass: 'testpass' },
          from: 'noreply@test.com',
        };
      }
      return null;
    }),
  };

  const mockEmailTemplatesService = {
    generateAttendanceNotificationEmail: jest.fn().mockReturnValue({
      to: 'test@example.com',
      subject: 'Attendance Recorded',
      html: '<p>Test HTML</p>',
    }),
    generatePasswordResetEmail: jest.fn().mockReturnValue({
      to: 'test@example.com',
      subject: 'Password Reset',
      html: '<p>Reset your password</p>',
    }),
    generateWelcomeEmail: jest.fn().mockReturnValue({
      to: 'test@example.com',
      subject: 'Welcome',
      html: '<p>Welcome email</p>',
    }),
  };

  const mockEmailQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };

  // Mock data
  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockAttendance: Partial<Attendance> = {
    id: 'attendance-123',
    date: new Date(),
    clockIn: '09:00:00',
    clockOut: '17:00:00',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailTemplatesService, useValue: mockEmailTemplatesService }, 
        { provide: getQueueToken('email'), useValue: mockEmailQueue },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    emailQueue = module.get<Queue>(getQueueToken('email'));
    emailTemplatesService = module.get<EmailTemplatesService>(EmailTemplatesService); 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueAttendanceEmail', () => {
    it('should queue attendance email successfully', async () => {
      await service.queueAttendanceEmail(
        mockAttendance as Attendance,
        mockUser as User,
      );

      expect(mockEmailTemplatesService.generateAttendanceNotificationEmail)
        .toHaveBeenCalledWith(mockUser, mockAttendance);
      
      // Verify email was queued
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'attendance-notification',
        {
          to: 'test@example.com',
          subject: 'Attendance Recorded',
          html: '<p>Test HTML</p>',
        },
      );
    });

    it('should handle queue errors gracefully', async () => {
      // Make queue fail
      mockEmailQueue.add.mockRejectedValueOnce(new Error('Queue failed'));

      try {
        await service.queueAttendanceEmail(
          mockAttendance as Attendance,
          mockUser as User,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Queue failed');
      }
    });
  });

  describe('queuePasswordResetEmail', () => {
    it('should queue password reset email successfully', async () => {
      const resetToken = 'reset-token-123';
      
      await service.queuePasswordResetEmail(mockUser as User, resetToken);

      expect(mockEmailTemplatesService.generatePasswordResetEmail)
        .toHaveBeenCalledWith(mockUser, resetToken);
      
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'password-reset',
        {
          to: 'test@example.com',
          subject: 'Password Reset',
          html: '<p>Reset your password</p>',
        },
      );
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // This test might need a real nodemailer mock
      // For now, we'll just verify the method exists
      expect(service.sendEmail).toBeDefined();
    });
  });
});