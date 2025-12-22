import { Module, forwardRef } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CurrencyRatesModule } from '../currency-rates/currency-rates.module';

@Module({
  imports: [
    HttpModule, 
    ConfigModule, 
    forwardRef(() => CurrencyRatesModule),
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}

