import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/role.decorators';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private databaseHealth: DatabaseHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const azureConfig = this.configService.get('config.azure');
    const containerName = azureConfig?.containerName || 'nestjs-files';
    
    const checks = [
      // System health checks
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024), // 150MB
      () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),
      
      // Database health check
      () => this.databaseHealth.isHealthy('database'),
      
    ];

    return this.health.check(checks);
  }

  @Get('readiness')
  @HealthCheck()
  async readiness() {
    // Lightweight readiness probe - just check critical dependencies
    const checks = [
      () => this.databaseHealth.isHealthy('database'),
    ];

    return this.health.check(checks);
  }

  @Get('liveness')
  @HealthCheck()
  async liveness() {
    // Lightweight liveness probe - just check if app is running
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}