import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CurrencyModule } from '../currency/currency.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CurrencyModule, ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

