import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { ConvertDto } from './dto/convert.dto';

@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currency: CurrencyService) {}

  @Get('rate')
  rate() {
    return this.currency.getRate();
  }

  @Post('convert')
  convert(@Body() dto: ConvertDto) {
    const pricing = this.currency.applyPricing(dto.amount_cny);
    return {
      from: 'CNY',
      to: dto.to ?? 'TJS',
      amount_cny: dto.amount_cny,
      ...pricing,
      timestamp: new Date().toISOString(),
    };
  }
}

