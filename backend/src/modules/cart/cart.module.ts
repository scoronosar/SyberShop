import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CurrencyModule } from '../currency/currency.module';
import { ProductsModule } from '../products/products.module';
import { UserActivityModule } from '../user-activity/user-activity.module';

@Module({
  imports: [PrismaModule, CurrencyModule, ProductsModule, UserActivityModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

