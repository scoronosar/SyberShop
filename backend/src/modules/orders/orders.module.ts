import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { UserActivityModule } from '../user-activity/user-activity.module';

@Module({
  imports: [PrismaModule, CartModule, UserActivityModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

