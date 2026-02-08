import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService, EmailOptions } from '../services/email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('welcome')
  async handleWelcomeEmail(job: Job) {
    const { to, subject, html, metadata } = job.data;

    this.logger.log(
      `Processing ${metadata?.type || 'welcome'} email for ${to}`,
      EmailProcessor.name,
    );

    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });

    if (success) {
      this.logger.log(
        `${metadata?.type || 'Welcome'} email sent to ${to}`,
        EmailProcessor.name,
      );
    } else {
      throw new Error(
        `Failed to send ${metadata?.type || 'welcome'} email to ${to}`,
      );
    }
  }

  @Process('attendance-notification')
  async handleAttendanceNotification(job: Job) {
    const { to, subject, html } = job.data;

    this.logger.log(
      `Processing attendance email for ${to}`,
      EmailProcessor.name,
    );

    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });

    if (success) {
      this.logger.log(`Attendance email sent to ${to}`, EmailProcessor.name);
    } else {
      throw new Error(`Failed to send attendance email to ${to}`);
    }
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job) {
    const { to, subject, html } = job.data;

    this.logger.log(
      `Processing password reset email for ${to}`,
      EmailProcessor.name,
    );

    const success = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });

    if (success) {
      this.logger.log(
        `Password reset email sent to ${to}`,
        EmailProcessor.name,
      );
    } else {
      throw new Error(`Failed to send password reset email to ${to}`);
    }
  }
}
