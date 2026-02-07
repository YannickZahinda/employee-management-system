export interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
  errors?: ValidationError[];
  stack?: string;
  // For debugging (only in non-production)
  body?: any;
  query?: any;
  params?: any;
  user?: any;
}

export interface ValidationError {
  property: string;
  value?: any;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}

export interface ExceptionDetails {
  exception: unknown;
  request: any;
  statusCode: number;
  message: string;
}