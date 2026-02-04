import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private defaultTTL = 300; // 5 minutes

  constructor(@Inject(CACHE_MANAGER) private cacheManager: any) {}

  static setTTL(ttl: number) {
    const interceptor = new CacheInterceptor(null as any);
    interceptor.defaultTTL = ttl;
    return interceptor;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = this.generateCacheKey(request);

    const cachedResponse = await this.cacheManager.get(key);
    
    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(key, response, this.defaultTTL * 1000);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { url, method, query, body } = request;
    return `${method}:${url}:${JSON.stringify(query)}:${JSON.stringify(body)}`;
  }
}