import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { EmailService } from './services/email.service';
import { EmailTemplatesService } from './services/email-templates.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('config.redis.host'),
          port: configService.get('config.redis.port'),
          password: configService.get('config.redis.password'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailProcessor, EmailService, EmailTemplatesService],
  exports: [BullModule, EmailService, EmailTemplatesService],
})
export class QueueModule {}