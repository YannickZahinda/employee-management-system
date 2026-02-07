import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { AdminSeedService } from 'src/database/seeds/admin.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(AdminSeedService);
  
  try {
    await seedService.seed();
    console.log('✅ Admin seed completed successfully');
  } catch (error) {
    console.error('❌ Admin seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();