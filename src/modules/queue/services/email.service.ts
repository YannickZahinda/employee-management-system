import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { User } from 'src/modules/users/entity/user.entity';
import { EmailTemplatesService} from './email-templates.service';

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
    private emailTemplatesService: EmailTemplatesService,
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
      this.logger.log(`📧 Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // Queue email using templates
  async queueWelcomeEmail(user: User, plainPassword?: string): Promise<void> {
    const template = this.emailTemplatesService.generateWelcomeEmail(user, plainPassword);
    await this.emailQueue.add('welcome', template);
    this.logger.log(`📧 Welcome email queued for ${user.email}`);
  }

  async queuePasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const template = this.emailTemplatesService.generatePasswordResetEmail(user, resetToken);
    await this.emailQueue.add('password-reset', template);
    this.logger.log(`📧 Password reset email queued for ${user.email}`);
  }

  async queueAttendanceEmail(attendance: Attendance, user: User): Promise<void> {
    const template = this.emailTemplatesService.generateAttendanceNotificationEmail(user, attendance);
    await this.emailQueue.add('attendance-notification', template);
    this.logger.log(`📧 Attendance email queued for ${user.email}`);
  }

  // Direct send (bypass queue for testing)
  async sendDirectEmail(options: EmailOptions): Promise<boolean> {
    return this.sendEmail(options);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email transporter connection verified');
      return true;
    } catch (error) {
      this.logger.error('❌ Email transporter connection failed:', error);
      return false;
    }
  }
}