import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/modules/users/entity/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed() {
    const adminEmail = 'zahinday@gmail.com';
    
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return;
    }

    const admin = this.userRepository.create({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'Zahinda Mulikuza',
      password: 'Admin123!',
      role: UserRole.ADMIN,
      phoneNumber: '+250783020147',
      employeeIdentifier: 'ADMIN002',
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await this.userRepository.save(admin);
    
    this.logger.log('Admin user created successfully');
    this.logger.log(`Email: ${adminEmail}`);
    this.logger.log(`Password: Admin123!`);
    this.logger.warn('CHANGE THE PASSWORD AFTER FIRST LOGIN!');
  }
}