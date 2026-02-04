import { applyDecorators, UseInterceptors } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  CacheInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
} from '../interceptors';
import { Throttle } from '@nestjs/throttler';
// Custom param decorator
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
}

export function ApiController(name: string, tag?: string) {
  return applyDecorators(ApiTags(tag || name), ApiBearerAuth());
}

export function GetWithCache(path?: string, ttl = 60) {
  return applyDecorators(
    ApiOperation({ summary: `Get ${path || 'resource'}` }),
    ApiResponse({ status: 200, description: 'Success' }),
    ApiResponse({ status: 404, description: 'Not found' }),
    Throttle({ default: { ttl: 30, limit: 10 } }),
    UseInterceptors(CacheInterceptor.setTTL(ttl), TransformInterceptor),
  );
}

export function SecurePost(path?: string, roles: UserRole[] = []) {
  return applyDecorators(
    ApiOperation({ summary: `Create ${path || 'resource'}` }),
    ApiResponse({ status: 201, description: 'Created' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    Throttle({ default: { ttl: 60, limit: 5 } }),
    UseInterceptors(new TimeoutInterceptor(10000), TransformInterceptor),
  );
}

export function ApiPagination() {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      example: '-createdAt',
    }),
    ApiQuery({ name: 'search', required: false, type: String }),
  );
}

export function ApiIdParam(name = 'id') {
  return applyDecorators(
    ApiParam({ name, type: String, description: 'Resource ID' }),
  );
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);
