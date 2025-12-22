import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('currency-rates')
export class CurrencyRatesController {
  constructor(private readonly currencyRatesService: CurrencyRatesService) {}

  /**
   * Get all currency rates (public)
   */
  @Get()
  async getAll() {
    await this.currencyRatesService.initializeDefaults();
    return this.currencyRatesService.getActive();
  }

  /**
   * Get all rates including inactive (admin only)
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllAdmin() {
    await this.currencyRatesService.initializeDefaults();
    return this.currencyRatesService.getAll();
  }

  /**
   * Update currency rate (admin only)
   */
  @Put(':currency')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateRate(
    @Param('currency') currency: string,
    @Body() body: {
      rateFromCNY?: number;
      markup?: number;
      isActive?: boolean;
      name?: string;
      symbol?: string;
    },
  ) {
    return this.currencyRatesService.updateRate(currency, body);
  }
}

