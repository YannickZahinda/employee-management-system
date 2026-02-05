import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './services/email.service';
import { Public } from 'src/common/decorators/role.decorators';

@ApiTags('Test Email')
@Controller('test-email')
export class TestEmailController {
  constructor(private emailService: EmailService) {}

  @Public()
  @Post('send')
  @ApiOperation({ summary: 'Send test email directly' })
  @ApiResponse({ status: 200, description: 'Test email sent' })
  async testSend() {
    const success = await this.emailService.sendEmail({
      to: 'ymulikuza@gmail.com', // Change to your email
      subject: 'Test Email from Employee Management System',
      html: `
        <h1>Test Email Successful! 🎉</h1>
        <p>If you receive this, your email configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>System:</strong> Employee Management System</p>
      `,
    });
    
    return { 
      success, 
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('queue')
  @ApiOperation({ summary: 'Queue test email (simulated attendance)' })
  @ApiResponse({ status: 200, description: 'Test email queued' })
  async testQueue() {
    // Simulate attendance data
    const mockAttendance = {
      date: new Date(),
      clockIn: '09:00:00',
      clockOut: '17:00:00',
      status: 'present',
      workingHours: 8,
    };

    const mockUser = {
      firstName: 'Test',
      email: 'ymulikuza@gmail.com', 
    };

    await this.emailService.queueAttendanceEmail(
      mockAttendance as any,
      mockUser as any,
    );
    
    return { 
      message: 'Test email queued successfully',
      timestamp: new Date().toISOString(),
      note: 'Email will be processed by background worker',
    };
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check email service status' })
  @ApiResponse({ status: 200, description: 'Email service status' })
  async checkStatus() {
    const emailConfig = this.emailService['configService'].get('config.email');
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        hasAuth: !!emailConfig.auth.user,
        from: emailConfig.from,
      },
      note: emailConfig.auth.user 
        ? 'Using real SMTP configuration' 
        : 'Using mock/development configuration',
    };
  }
}