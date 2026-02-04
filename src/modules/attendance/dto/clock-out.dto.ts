import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ClockOutDto {
  @ApiProperty({ example: '17:00:00', description: 'Clock-out time in HH:mm:ss format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in HH:mm:ss format',
  })
  time: string;
}