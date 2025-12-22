import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CurrencyModule } from '../currency/currency.module';
import { CurrencyRatesModule } from '../currency-rates/currency-rates.module';
import { TaobaoModule } from '../taobao/taobao.module';

@Module({
  imports: [CurrencyModule, CurrencyRatesModule, TaobaoModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

