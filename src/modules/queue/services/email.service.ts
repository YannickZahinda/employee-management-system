import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Attendance } from 'src/modules/attendance/entities/attendance.entity';
import { User } from 'src/modules/users/entity/user.entity';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('config.email');

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth.user ? {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      } : undefined,
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailConfig = this.configService.get('config.email');
      
      const mailOptions = {
        from: emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async queueAttendanceEmail(attendance: Attendance, user: User): Promise<void> {
    const subject = `Attendance Recorded - ${attendance.date.toDateString()}`;
    
    const html = `
      <h2>Attendance Recorded</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your attendance has been recorded for ${attendance.date.toDateString()}.</p>
      <ul>
        <li><strong>Clock In:</strong> ${attendance.clockIn || 'Not recorded'}</li>
        <li><strong>Clock Out:</strong> ${attendance.clockOut || 'Not recorded'}</li>
        <li><strong>Status:</strong> ${attendance.status}</li>
        <li><strong>Working Hours:</strong> ${attendance.workingHours} hours</li>
      </ul>
      <p>Thank you!</p>
    `;

    await this.emailQueue.add('attendance-notification', {
      to: user.email,
      subject,
      html,
    });
  }

  async queuePasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.firstName},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.emailQueue.add('password-reset', {
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  }
}