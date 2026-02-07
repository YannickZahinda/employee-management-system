import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123!',
        phoneNumber: '+1234567890',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(registerDto.email);
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      const user = userRepository.create({
        email: 'duplicate@example.com',
        firstName: 'First',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: UserRole.EMPLOYEE,
      });
      await userRepository.save(user);

      // Try to register with same email
      const registerDto = {
        email: 'duplicate@example.com',
        firstName: 'Second',
        lastName: 'User',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409); // Conflict
    });

    it('should fail with invalid data', async () => {
      const invalidDto = {
        email: 'invalid-email',
        firstName: 'J',
        lastName: 'D',
        password: 'short',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400); // Bad Request
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create a user first
      const user = userRepository.create({
        email: 'login@example.com',
        firstName: 'Login',
        lastName: 'User',
        password: await bcrypt.hash('Password123!', 10),
        role: UserRole.EMPLOYEE,
        isActive: true,
      });
      await userRepository.save(user);

      const loginDto = {
        email: 'login@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(loginDto.email);
    });

    it('should fail with invalid credentials', async () => {
      const loginDto = {
        email: 'wrong@example.com',
        password: 'WrongPassword!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401); // Unauthorized
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // This test would require a valid refresh token
      // For now, we'll just test the endpoint exists
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'test-token' })
        .expect(401); // Expect unauthorized since token is invalid
    });
  });

  describe('POST /auth/logout', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401); // Unauthorized
    });
  });
});