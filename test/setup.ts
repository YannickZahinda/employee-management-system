import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/modules/users/entity/user.entity';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

const mockEmailService = {
  sendEmail: jest.fn(),
  queueAttendanceEmail: jest.fn(),
  queuePasswordResetEmail: jest.fn(),
};

beforeAll(async () => {
  // Global test setup if needed
});

afterAll(async () => {
  // Global teardown if needed
});

afterEach(async () => {
  jest.clearAllMocks();
});

// Export common mocks and utilities
export { mockLogger, mockQueue, mockEmailService };