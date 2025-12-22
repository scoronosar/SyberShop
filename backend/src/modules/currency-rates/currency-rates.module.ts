import { Module } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';
import { CurrencyRatesController } from './currency-rates.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CurrencyRatesController],
  providers: [CurrencyRatesService],
  exports: [CurrencyRatesService],
})
export class CurrencyRatesModule {}

