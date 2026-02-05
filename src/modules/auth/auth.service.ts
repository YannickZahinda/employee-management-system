import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { WinstonLogger } from '../../shared/logger/winston.logger';
import { User, UserRole } from '../users/entity/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: WinstonLogger,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.usersService.create(registerDto);

    // Generate tokens for immediate login
    const tokens = await this.generateTokens(user);

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`, AuthService.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        employeeIdentifier: user.employeeIdentifier,
        phoneNumber: user.phoneNumber,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      this.logger.warn(
        `Failed login attempt for email: ${email}`,
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${email}`, AuthService.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        employeeIdentifier: user.employeeIdentifier,
        phoneNumber: user.phoneNumber,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('config.jwtSecret') + 'refresh',
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isValid || user.refreshTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const tokens = await this.generateTokens(user);

      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: undefined,
      refreshTokenExpiresAt: undefined,
    });

    this.logger.log(`User logged out: ${userId}`, AuthService.name);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersService.saveUser(user);

    // Return user without sensitive data
    const { password: _, refreshToken: __, ...safeUser } = user;
    return safeUser as User;
  }

  private async generateTokens(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('config.jwtSecret'),
        expiresIn: this.configService.get('config.jwtExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('config.jwtSecret') + 'refresh',
        expiresIn:
          this.configService.get('config.refreshTokenExpiration') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.configService.get('config.jwtExpiration'),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get('config.jwtSecret') + 'reset',
        expiresIn: '1h',
      },
    );

    // Hash the reset token
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(resetToken, salt);

    // Save token and expiry
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.saveUser(user);

    // TODO: Send email with reset token
    this.logger.log(
      `Password reset token generated for: ${email}`,
      AuthService.name,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('config.jwtSecret') + 'reset',
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.passwordResetToken) {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Verify token matches stored hash
      const isValid = await bcrypt.compare(token, user.passwordResetToken);

      if (
        !isValid ||
        !user.passwordResetExpiresAt ||
        user.passwordResetExpiresAt < new Date()
      ) {
        throw new UnauthorizedException('Reset token expired');
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken ? user.passwordResetToken : undefined;
      user.passwordResetExpiresAt ? user.passwordResetExpiresAt : undefined;

      await this.usersService.saveUser(user);

      this.logger.log(
        `Password reset successful for user: ${user.email}`,
        AuthService.name,
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
