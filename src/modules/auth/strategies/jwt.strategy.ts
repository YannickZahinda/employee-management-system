import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('config.jwtSecret') || 'default-secret',
    });
  }

  async validate(payload: TokenPayload) {
    console.log('🔐 JWT Payload:', payload);
    
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return {
      id: user.id,         
      email: user.email,
      role: user.role,       
      firstName: user.firstName,
      lastName: user.lastName,
      employeeIdentifier: user.employeeIdentifier,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      sub: payload.sub,
    };
  }
}