import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';
import { UserRole } from '../../../common/decorators/api.decorators';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'john.doe@company.com',
    description: 'Employee email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'Employee first name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Employee last name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Employee password (min 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Employee phone number',
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.EMPLOYEE,
    description: 'Employee role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.EMPLOYEE;

  @ApiProperty({
    example: 'EMP001',
    description: 'Employee identifier (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  employeeIdentifier?: string;
}