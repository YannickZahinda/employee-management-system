import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLogger } from '../../shared/logger/winston.logger';
import { ErrorResponse, ValidationError, ExceptionDetails } from '../interfaces/error-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly winstonLogger: WinstonLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.extractExceptionDetails(exception);
    const correlationId = this.extractCorrelationId(request);

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
    };

    // Add validation errors if present
    if (errors && errors.length > 0) {
      errorResponse.errors = errors;
    }

    // Add stack trace for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = this.extractStackTrace(exception);
      errorResponse.body = request.body;
      errorResponse.query = request.query;
      errorResponse.params = request.params;
      errorResponse.user = (request as any).user;
    }

    // Log the error appropriately
    this.logError(exception, request, statusCode, message, correlationId);

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  private extractExceptionDetails(exception: unknown): {
    statusCode: number;
    message: string;
    errors: ValidationError[];
  } {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ValidationError[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        
        // Extract validation errors from class-validator
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          errors = this.extractValidationErrors(responseObj.message);
        } else if (responseObj.errors) {
          errors = this.extractValidationErrors(responseObj.errors);
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Handle specific error types
      if (exception.name === 'MongoError' || exception.name === 'QueryFailedError') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = this.handleDatabaseError(exception);
      } else if (exception.name === 'JsonWebTokenError') {
        statusCode = HttpStatus.UNAUTHORIZED;
        message = 'Invalid token';
      } else if (exception.name === 'TokenExpiredError') {
        statusCode = HttpStatus.UNAUTHORIZED;
        message = 'Token expired';
      }
    } else if (typeof exception === 'string') {
      message = exception;
    }

    return { statusCode, message, errors };
  }

  private extractValidationErrors(messages: any[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const processError = (error: any, parentProperty = ''): ValidationError => {
      const property = parentProperty ? `${parentProperty}.${error.property}` : error.property;
      
      const validationError: ValidationError = {
        property,
        value: error.value,
        constraints: error.constraints,
      };

      if (error.children && error.children.length > 0) {
        validationError.children = error.children.map((child: any) => 
          processError(child, property)
        );
      }

      return validationError;
    };

    messages.forEach((error: any) => {
      errors.push(processError(error));
    });

    return errors;
  }

  private handleDatabaseError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('duplicate key')) {
      return 'A record with this value already exists';
    } else if (message.includes('foreign key constraint')) {
      return 'Referenced record does not exist';
    } else if (message.includes('null constraint')) {
      return 'Required field cannot be null';
    } else if (message.includes('connection')) {
      return 'Database connection error';
    }
    
    return 'Database operation failed';
  }

  private extractCorrelationId(request: Request): string {
    return (
      request.headers['x-correlation-id'] as string ||
      request.headers['x-request-id'] as string ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }

  private extractStackTrace(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }

  private logError(
    exception: unknown,
    request: Request,
    statusCode: number,
    message: string,
    correlationId: string,
  ): void {
    const logDetails = {
      correlationId,
      path: request.url,
      method: request.method,
      statusCode,
      message,
      userId: (request as any).user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (statusCode >= 500) {
      // Critical errors - log with full details
      this.winstonLogger.error(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        'HttpExceptionFilter',
      );
      
      // Additional structured logging for monitoring
      this.logger.error(JSON.stringify({
        ...logDetails,
        type: 'SERVER_ERROR',
        exception: exception instanceof Error ? {
          name: exception.name,
          message: exception.message,
        } : undefined,
      }));
    } else if (statusCode >= 400) {
      // Client errors - warn level
      this.winstonLogger.warn(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        'HttpExceptionFilter',
      );
      
      this.logger.warn(JSON.stringify({
        ...logDetails,
        type: 'CLIENT_ERROR',
      }));
    } else {
      // Other errors
      this.winstonLogger.debug(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        'HttpExceptionFilter',
      );
    }

    // Console logging for development
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n🚨 Exception Details:');
      console.error(`⏱️  Timestamp: ${new Date().toISOString()}`);
      console.error(`🆔 Correlation ID: ${correlationId}`);
      console.error(`🔗 Path: ${request.method} ${request.url}`);
      console.error(`📊 Status: ${statusCode}`);
      console.error(`💬 Message: ${message}`);
      console.error(`👤 User: ${JSON.stringify((request as any).user || 'Unauthenticated')}`);
      console.error(`📦 Body: ${JSON.stringify(request.body, null, 2)}`);
      console.error(`🔍 Query: ${JSON.stringify(request.query, null, 2)}`);
      
      if (exception instanceof Error && exception.stack) {
        console.error(`🗂️ Stack Trace:\n${exception.stack}`);
      }
    }
  }
}