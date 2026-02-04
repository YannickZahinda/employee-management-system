import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WinstonLogger } from './shared/logger/winston.logger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const logger = app.get(WinstonLogger); // Get from DI container

  app.useLogger(logger);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // CORS configuration
  app.enableCors({
    origin: configService.get('config.corsOrigins'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  });

  app.setGlobalPrefix('api/v1');

  // Swagger configuration
  if (configService.get('config.swaggerEnabled')) {
    const config = new DocumentBuilder()
      .setTitle('NestJS Azure Boilerplate API')
      .setDescription('Production-ready NestJS API with Azure integration')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  const port = configService.get('config.port');
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/api/v1`,
    'Bootstrap',
  );
  logger.log(
    `📚 Swagger documentation: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
  logger.log(
    `🔧 Environment: ${configService.get('config.nodeEnv')}`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
