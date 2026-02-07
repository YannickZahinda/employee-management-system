import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { ApiProperty } from '@nestjs/swagger';
import { Attendance } from '../../attendance/entities/attendance.entity';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
}

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ example: 'EMP001' })
  @Column({ unique: true })
  employeeIdentifier: string;

  @ApiProperty({ example: '+1234567890' })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({ enum: UserRole, default: UserRole.EMPLOYEE })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  emailVerifiedAt: Date;

  @Exclude()
  @Column({ nullable: true })
  refreshToken: string;

  @Exclude()
  @Column({ nullable: true })
  refreshTokenExpiresAt: Date;

  @Exclude()
  @Column({ nullable: true })
  passwordResetToken: string;

  @Exclude()
  @Column({ nullable: true })
  passwordResetExpiresAt: Date;

  @ApiProperty()
  @Column({ nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @BeforeInsert()
  generateEmployeeIdentifier() {
    if (!this.employeeIdentifier) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.employeeIdentifier = `EMP${random}`;
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}