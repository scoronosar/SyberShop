import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CurrencyRatesService {
  private readonly logger = new Logger(CurrencyRatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize default currency rates if not exist
   */
  async initializeDefaults() {
    const count = await this.prisma.currencyRate.count();
    
    if (count === 0) {
      this.logger.log('Initializing default currency rates...');
      
      const defaultRates = [
        {
          currency: 'RUB',
          code: 'RUB',
          name: 'Российский рубль',
          symbol: '₽',
          rateFromCNY: new Decimal(13.0), // 1 CNY = 13 RUB
          markup: new Decimal(1.05), // 5% markup
          isActive: true,
        },
        {
          currency: 'USD',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          rateFromCNY: new Decimal(0.14), // 1 CNY = 0.14 USD
          markup: new Decimal(1.05),
          isActive: true,
        },
        {
          currency: 'UZS',
          code: 'UZS',
          name: 'Узбекский сум',
          symbol: 'сўм',
          rateFromCNY: new Decimal(1800), // 1 CNY = 1800 UZS
          markup: new Decimal(1.05),
          isActive: true,
        },
        {
          currency: 'TJS',
          code: 'TJS',
          name: 'Таджикский сомони',
          symbol: 'ЅМ',
          rateFromCNY: new Decimal(1.5), // 1 CNY = 1.5 TJS
          markup: new Decimal(1.05),
          isActive: true,
        },
        {
          currency: 'KZT',
          code: 'KZT',
          name: 'Казахстанский тенге',
          symbol: '₸',
          rateFromCNY: new Decimal(65), // 1 CNY = 65 KZT
          markup: new Decimal(1.05),
          isActive: true,
        },
        {
          currency: 'CNY',
          code: 'CNY',
          name: 'Китайский юань',
          symbol: '¥',
          rateFromCNY: new Decimal(1.0), // 1 CNY = 1 CNY
          markup: new Decimal(1.05),
          isActive: true,
        },
      ];

      await this.prisma.currencyRate.createMany({
        data: defaultRates,
      });

      this.logger.log('✓ Default currency rates initialized');
    }
  }

  /**
   * Get all currency rates
   */
  async getAll() {
    return this.prisma.currencyRate.findMany({
      orderBy: { currency: 'asc' },
    });
  }

  /**
   * Get active currency rates only
   */
  async getActive() {
    return this.prisma.currencyRate.findMany({
      where: { isActive: true },
      orderBy: { currency: 'asc' },
    });
  }

  /**
   * Get specific currency rate
   */
  async getRate(currency: string) {
    return this.prisma.currencyRate.findUnique({
      where: { currency },
    });
  }

  /**
   * Update currency rate
   */
  async updateRate(
    currency: string,
    data: {
      rateFromCNY?: number;
      markup?: number;
      isActive?: boolean;
      name?: string;
      symbol?: string;
    },
  ) {
    const updateData: any = {};
    
    if (data.rateFromCNY !== undefined) {
      updateData.rateFromCNY = new Decimal(data.rateFromCNY);
    }
    if (data.markup !== undefined) {
      updateData.markup = new Decimal(data.markup);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.symbol !== undefined) {
      updateData.symbol = data.symbol;
    }

    return this.prisma.currencyRate.update({
      where: { currency },
      data: updateData,
    });
  }

  /**
   * Convert CNY to target currency
   */
  async convert(amountCNY: number, targetCurrency: string): Promise<number> {
    const rate = await this.getRate(targetCurrency);
    
    if (!rate || !rate.isActive) {
      this.logger.warn(`Currency ${targetCurrency} not found or inactive, using default rate`);
      return amountCNY * 13; // Default fallback to RUB
    }

    const rateValue = parseFloat(rate.rateFromCNY.toString());
    const markupValue = parseFloat(rate.markup.toString());
    
    return amountCNY * rateValue * markupValue;
  }
}

