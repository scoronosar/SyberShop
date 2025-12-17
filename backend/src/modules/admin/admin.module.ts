import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { LogisticsModule } from '../logistics/logistics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LogisticsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}

