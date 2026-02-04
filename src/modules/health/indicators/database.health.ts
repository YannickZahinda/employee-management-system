import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dataSource.query('SELECT 1');
      
      const options = this.dataSource.options;
      const connectionInfo = this.extractConnectionInfo(options);
      
      const resultData = this.getStatus(key, true, {
        connectionState: 'connected',
        databaseName: options.database,
        type: options.type,
        ...connectionInfo, 
      });

      return resultData;
    } catch (error) {
      const resultData = this.getStatus(key, false, {
        connectionState: 'disconnected',
        error: error.message,
      });
      
      throw new HealthCheckError('Database is not connected', resultData);
    }
  }

  private extractConnectionInfo(options: any): Record<string, any> {
    const info: Record<string, any> = {};
    
    // Extract host if it exists (PostgreSQL, MySQL, etc.)
    if (options.host !== undefined) {
      info.host = options.host;
    }
    
    // Extract port if it exists
    if (options.port !== undefined) {
      info.port = options.port;
    }
    
    // Extract username if it exists
    if (options.username !== undefined) {
      info.username = options.username;
    }
    
    // For SQLite, extract path
    if (options.type === 'sqlite' && options.database) {
      info.path = options.database;
    }
    
    return info;
  }
}