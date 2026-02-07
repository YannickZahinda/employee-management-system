import { UserRole } from '../../../common/decorators/api.decorators';

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}