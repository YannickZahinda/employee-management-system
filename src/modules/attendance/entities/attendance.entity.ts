import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entity/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
}

@Entity('attendances')
export class Attendance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ example: '09:00:00' })
  @Column({ type: 'time', nullable: true })
  clockIn: string;

  @ApiProperty({ example: '17:00:00' })
  @Column({ type: 'time', nullable: true })
  clockOut: string;

  @ApiProperty({ enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @ApiProperty()
  @Column()
  employeeId: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isEmailSent: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  get workingHours(): number {
    if (!this.clockIn || !this.clockOut) return 0;

    const [inHours, inMinutes] = this.clockIn.split(':').map(Number);
    const [outHours, outMinutes] = this.clockOut.split(':').map(Number);

    const start = new Date(0, 0, 0, inHours, inMinutes);
    const end = new Date(0, 0, 0, outHours, outMinutes);
    
    const diff = end.getTime() - start.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }

  get isLate(): boolean {
    if (!this.clockIn) return false;
    
    const [hours, minutes] = this.clockIn.split(':').map(Number);
    const checkInTime = new Date(0, 0, 0, hours, minutes);
    const expectedTime = new Date(0, 0, 0, 9, 30); // 9:30 AM is late
    
    return checkInTime > expectedTime;
  }
}