import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { firstValueFrom } from 'rxjs';
import { CurrencyRatesService } from '../currency-rates/currency-rates.service';

const SERVICE_FEE = 0.03;

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cachedRate?: { rate: number; fetchedAt: number };
  private ttlMs = 5 * 60 * 1000; // 5 минут

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => CurrencyRatesService))
    private readonly currencyRates: CurrencyRatesService,
  ) {}

  private async fetchExternalRate(from: string, to: string): Promise<number> {
    const apiKey = this.config.get<string>('CURRENCY_API_KEY');
    const url = this.config.get<string>('CURRENCY_API_URL') || 'https://api.exchangerate.host/convert';
    const params: Record<string, string> = { from, to };
    if (apiKey) params['apikey'] = apiKey;
    try {
      const res = await firstValueFrom(this.http.get(url, { params }));
      const rate =
        Number(res.data?.rate) ??
        Number(res.data?.result) ??
        Number(res.data?.info?.rate) ??
        Number(res.data?.data?.rate);
      if (Number.isFinite(rate) && rate > 0) return rate;
      this.logger.warn(`Bad rate response, fallback to mock: ${JSON.stringify(res.data)}`);
      return 13;
    } catch (e) {
      this.logger.error('Failed to fetch rate, fallback to mock', e);
      return 13;
    }
  }

  private async getFreshRate(from: string, to: string) {
    const now = Date.now();
    if (this.cachedRate && now - this.cachedRate.fetchedAt < this.ttlMs) {
      return this.cachedRate.rate;
    }
    const rate = await this.fetchExternalRate(from, to);
    this.cachedRate = { rate, fetchedAt: now };
    return rate;
  }

  async getRate(from = 'CNY', to = 'TJS') {
    const rate = await this.getFreshRate(from, to);
    const rateWithMarkup = Number((rate * MARKUP).toFixed(2));
    return {
      from,
      to,
      rate,
      rate_with_markup: rateWithMarkup,
      timestamp: new Date().toISOString(),
    };
  }

  async applyPricing(amountCny: number, to = 'RUB') {
    // Try to get rate from database first
    const currencyRate = await this.currencyRates.getRate(to);
    
    let rate: number;
    let markup: number;
    
    if (currencyRate && currencyRate.isActive) {
      // Use custom rate from database
      rate = parseFloat(currencyRate.rateFromCNY.toString());
      markup = parseFloat(currencyRate.markup.toString());
      this.logger.log(`Using custom rate for ${to}: ${rate} (markup: ${markup})`);
    } else {
      // Fallback to external API
      this.logger.warn(`No custom rate found for ${to}, using external API`);
      rate = await this.getFreshRate('CNY', to);
      markup = 1.05; // Default 5% markup
    }
    
    const converted = amountCny * rate;
    const convertedWithMarkup = converted * markup;
    const finalPerItem = convertedWithMarkup * (1 + SERVICE_FEE);
    const serviceFeeAmount = convertedWithMarkup * SERVICE_FEE;
    
    return {
      rate,
      rate_with_markup: Number((rate * markup).toFixed(2)),
      converted: this.round2(converted),
      converted_with_markup: this.round2(convertedWithMarkup),
      final_per_item: this.round2(finalPerItem),
      service_fee_percent: SERVICE_FEE,
      service_fee_amount: this.round2(serviceFeeAmount),
      calculation: {
        step1_converted: this.round2(converted),
        step2_markup: this.round2(convertedWithMarkup),
        step3_service_fee: this.round2(serviceFeeAmount),
      },
    };
  }

  private round2(n: number | Decimal) {
    return Number(Number(n).toFixed(2));
  }
}

