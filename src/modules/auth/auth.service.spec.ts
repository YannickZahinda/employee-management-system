import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from '../../shared/logger/winston.logger';
import { UnauthorizedException } from '@nestjs/common';
import { EmailService } from '../queue/services/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService; 

  const mockUsersService = {
    findByEmail: jest.fn(),
    validateUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    saveUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'config.jwtSecret') return 'test-secret';
      if (key === 'config.jwtExpiration') return '1h';
      if (key === 'config.refreshTokenExpiration') return '7d';
      return null;
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  // Add mock for EmailService
  const mockEmailService = {
    queueAttendanceEmail: jest.fn(),
    queuePasswordResetEmail: jest.fn(),
    queueWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WinstonLogger, useValue: mockLogger },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-123';

      mockUsersService.update.mockResolvedValue({
        id: userId,
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
      });

      await service.logout(userId);

      expect(mockUsersService.update).toHaveBeenCalledWith(userId, {
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        `User logged out: ${userId}`,
        'AuthService',
      );
    });
  });
});
