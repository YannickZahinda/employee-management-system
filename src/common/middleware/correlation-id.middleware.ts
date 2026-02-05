import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    // Add to request
    (req as any).correlationId = correlationId;
    
    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Add to logger context (if needed)
    next();
  }
}