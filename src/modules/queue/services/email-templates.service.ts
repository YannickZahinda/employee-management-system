import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Attendance,
  AttendanceStatus,
} from 'src/modules/attendance/entities/attendance.entity';
import { User } from 'src/modules/users/entity/user.entity';

export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  metadata?: {
    type: string;
    userId?: string;
    timestamp?: string;
  };
}

@Injectable()
export class EmailTemplatesService {
  constructor(private configService: ConfigService) {}

  generateWelcomeEmail(user: User, plainPassword?: string): EmailTemplateData {
    const frontendUrl =
      this.configService.get('config.frontendUrl') || 'http://localhost:3000';

    let subject: string;
    let html: string;

    if (plainPassword) {
      // Employee created by admin
      subject = `Welcome to Employee Management System - Your Account Credentials`;
      html = this.getEmployeeWelcomeTemplate(user, plainPassword, frontendUrl);
    } else {
      // Self-registration
      subject = `Welcome to Employee Management System - Registration Successful`;
      html = this.getRegistrationWelcomeTemplate(user, frontendUrl);
    }

    return {
      to: user.email,
      subject,
      html,
      metadata: {
        type: plainPassword ? 'employee_welcome' : 'registration_welcome',
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  generatePasswordResetEmail(
    user: User,
    resetToken: string,
  ): EmailTemplateData {
    const frontendUrl =
      this.configService.get('config.frontendUrl') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request - Employee Management System';
    const html = this.getPasswordResetTemplate(user, resetUrl, resetToken);

    return {
      to: user.email,
      subject,
      html,
      metadata: {
        type: 'password_reset',
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  generateAttendanceNotificationEmail(
    user: User,
    attendance: any,
  ): EmailTemplateData {
    const subject = `Attendance Recorded - ${attendance.date.toDateString()}`;
    const html = this.getAttendanceNotificationTemplate(user, attendance);

    return {
      to: user.email,
      subject,
      html,
      metadata: {
        type: 'attendance_notification',
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private getEmployeeWelcomeTemplate(
    user: User,
    plainPassword: string,
    frontendUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Employee Management System</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
              .credentials { background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .credential-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>👋 Welcome to Employee Management System</h1>
          </div>
          <div class="content">
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>Your employee account has been created successfully. Here are your login credentials:</p>
              
              <div class="credentials">
                  <div class="credential-item"><strong>📧 Email:</strong> ${user.email}</div>
                  <div class="credential-item"><strong>🔐 Password:</strong> ${plainPassword}</div>
                  <div class="credential-item"><strong>🆔 Employee ID:</strong> ${user.employeeIdentifier || 'Not assigned'}</div>
                  <div class="credential-item"><strong>👤 Role:</strong> ${user.role}</div>
              </div>
              
              <div class="warning">
                  ⚠️ <strong>Important:</strong> For security reasons, please change your password after first login.
              </div>
              
              <p>You can now access the system using these credentials:</p>
              <a href="${frontendUrl}/login" class="button">Login to Your Account</a>
              
              <p>If you have any questions or need assistance, please contact your administrator or HR department.</p>
              
              <p>Best regards,<br>The Employee Management Team</p>
          </div>
          <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
  }

  private getRegistrationWelcomeTemplate(
    user: User,
    frontendUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Successful</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>✅ Registration Successful!</h1>
          </div>
          <div class="content">
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>Thank you for registering with Employee Management System. Your account has been created successfully.</p>
              
              <p><strong>📧 Email:</strong> ${user.email}</p>
              <p><strong>🆔 Employee ID:</strong> ${user.employeeIdentifier || 'Not assigned'}</p>
              
              <p>You can now login to the system and start using all features:</p>
              <a href="${frontendUrl}/login" class="button">Login to Your Account</a>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>The Employee Management Team</p>
          </div>
          <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(
    user: User,
    resetUrl: string,
    resetToken: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .warning { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .token { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>You requested to reset your password. Click the button below to reset it:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                  ⚠️ <strong>This link will expire in 1 hour.</strong>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <div class="token">${resetUrl}</div>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>The Employee Management Team</p>
          </div>
          <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
  }

  private getAttendanceNotificationTemplate(
    user: User,
    attendance: any,
  ): string {
    const workingHours = attendance.workingHours || 0;
    const statusEmoji: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PRESENT]: '✅',
      [AttendanceStatus.ABSENT]: '❌',
      [AttendanceStatus.LATE]: '⚠️',
      [AttendanceStatus.LEAVE]: '🏖️',
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Attendance Recorded</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
              .attendance-details { background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .detail-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-item:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #4b5563; }
              .value { color: #111827; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>${statusEmoji} Attendance Recorded</h1>
          </div>
          <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>Your attendance has been recorded for <strong>${attendance.date.toDateString()}</strong>.</p>
              
              <div class="attendance-details">
                  <div class="detail-item">
                      <span class="label">Status:</span>
                      <span class="value">${attendance.status}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">Clock In:</span>
                      <span class="value">${attendance.clockIn || 'Not recorded'}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">Clock Out:</span>
                      <span class="value">${attendance.clockOut || 'Not recorded'}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">Working Hours:</span>
                      <span class="value">${workingHours} hours</span>
                  </div>
                  ${
                    attendance.notes
                      ? `
                  <div class="detail-item">
                      <span class="label">Notes:</span>
                      <span class="value">${attendance.notes}</span>
                  </div>
                  `
                      : ''
                  }
              </div>
              
              <p>Thank you for your hard work!</p>
              
              <p>Best regards,<br>The Employee Management Team</p>
          </div>
          <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
  }
}
