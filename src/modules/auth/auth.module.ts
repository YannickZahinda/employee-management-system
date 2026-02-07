import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Make sure this is imported
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('config.jwtSecret'),
        signOptions: {
          expiresIn: configService.get('config.jwtExpiration'),
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: 'email',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('config.redis.host'),
          port: configService.get('config.redis.port'),
          password: configService.get('config.redis.password'),
        }
      })
    }),
    LoggerModule,
    QueueModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}