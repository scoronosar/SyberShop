import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { LogisticsModule } from '../logistics/logistics.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [LogisticsModule, AuthModule, OrdersModule],
  controllers: [AdminController],
})
export class AdminModule {}

