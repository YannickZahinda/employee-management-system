import { UserRole } from '../../../common/decorators/api.decorators';

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}