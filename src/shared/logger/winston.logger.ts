import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

@Injectable()
export class WinstonLogger implements OnModuleInit {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeLogger();
  }

  private initializeLogger() {
    const nodeEnv = this.configService.get('config.nodeEnv');

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, trace, correlationId }) => {
              const corrId = correlationId ? `[${correlationId}]` : '';
              const ctx = context ? `[${context}]` : '';
              return `${timestamp} ${corrId} ${ctx} ${level}: ${message}${trace ? `\n${trace}` : ''}`;
            },
          ),
        ),
      }),
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ];

    this.logger = winston.createLogger({
      level: nodeEnv === 'production' ? 'info' : 'debug',
      levels: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 1,
        [LogLevel.INFO]: 2,
        [LogLevel.DEBUG]: 3,
        [LogLevel.VERBOSE]: 4,
      },
      defaultMeta: { service: 'employee-management' },
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
          format: winston.format.json(),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: 'logs/rejections.log',
          format: winston.format.json(),
        }),
      ],
    });
  }

  log(message: string, context?: string, correlationId?: string) {
    this.logger.info(message, { context, correlationId });
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    correlationId?: string,
  ) {
    this.logger.error(message, { context, trace, correlationId });
  }

  warn(message: string, context?: string, correlationId?: string) {
    this.logger.warn(message, { context, correlationId });
  }

  debug(message: string, context?: string, correlationId?: string) {
    this.logger.debug(message, { context, correlationId });
  }

  verbose(message: string, context?: string, correlationId?: string) {
    this.logger.verbose(message, { context, correlationId });
  }

  // Structured logging for analytics/monitoring
  auditLog(action: string, userId: string, details: any, context?: string) {
    this.logger.info('AUDIT_LOG', {
      context,
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
