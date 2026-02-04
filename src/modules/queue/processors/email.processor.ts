import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService, EmailOptions } from '../services/email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('attendance-notification')
  async handleAttendanceNotification(job: Job) {
    const { to, subject, html } = job.data;
    
    this.logger.log(`Processing attendance email for ${to}`);
    
    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });
    
    if (success) {
      this.logger.log(`Attendance email sent to ${to}`);
    } else {
      throw new Error(`Failed to send attendance email to ${to}`);
    }
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job) {
    const { to, subject, html } = job.data;
    
    this.logger.log(`Processing password reset email for ${to}`);
    
    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });
    
    if (success) {
      this.logger.log(`Password reset email sent to ${to}`);
    } else {
      throw new Error(`Failed to send password reset email to ${to}`);
    }
  }

  @Process('welcome')
  async handleWelcomeEmail(job: Job) {
    const { to, subject, html } = job.data;
    
    this.logger.log(`Processing welcome email for ${to}`);
    
    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });
    
    if (success) {
      this.logger.log(`Welcome email sent to ${to}`);
    } else {
      throw new Error(`Failed to send welcome email to ${to}`);
    }
  }
}