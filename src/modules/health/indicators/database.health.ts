import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = this.connection.readyState === 1; // 1 = connected
    
    const resultData = this.getStatus(key, isHealthy, {
      connectionState: this.getConnectionStateString(this.connection.readyState),
      databaseName: this.connection.name,
      host: this.connection.host,
      port: this.connection.port,
    });

    if (isHealthy) {
      return resultData;
    }
    
    throw new HealthCheckError('Database is not connected', resultData);
  }

  private getConnectionStateString(state: number): string {
    switch (state) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }
}