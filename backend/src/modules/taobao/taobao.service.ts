import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class TaobaoService {
  private readonly logger = new Logger(TaobaoService.name);
  private readonly appKey = process.env.TAOBAO_APP_KEY || '503900';
  private readonly appSecret = process.env.TAOBAO_APP_SECRET || 'AGx46GnoC0f7UqwdBaY7ZsFqFRCIk0te';
  private readonly apiUrl = 'https://api.taobao.com/router/rest';
  private readonly mode = process.env.TAOBAO_MODE || 'PROD';

  constructor(private readonly http: HttpService) {}

  private generateSign(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('');
    const sign = crypto
      .createHmac('md5', this.appSecret)
      .update(sorted)
      .digest('hex')
      .toUpperCase();
    return sign;
  }

  async searchProducts(query: string, page = 1, pageSize = 20) {
    if (this.mode === 'MOCK') {
      return this.getMockProducts(query);
    }

    try {
      const timestamp = Date.now().toString();
      const params: Record<string, any> = {
        method: 'aliexpress.ds.product.get',
        app_key: this.appKey,
        timestamp,
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        simplify: 'true',
        product_id: '1005003524527685', // Example product for testing
      };

      params.sign = this.generateSign(params);

      const response = await firstValueFrom(
        this.http.get(this.apiUrl, { params, timeout: 5000 }),
      );

      if (response.data?.error_response) {
        this.logger.warn(`TaoWorld API error: ${JSON.stringify(response.data.error_response)}, falling back to mock`);
        return this.getMockProducts(query);
      }

      // TaoWorld API returns different structure, for now use mocks
      this.logger.log('TaoWorld API available but using mocks for now (test mode)');
      return this.getMockProducts(query);
    } catch (error) {
      this.logger.warn(`Failed to fetch from TaoWorld API: ${error.message}, using mock data`);
      return this.getMockProducts(query);
    }
  }

  async getProductDetails(itemId: string) {
    if (this.mode === 'MOCK' || itemId.startsWith('mock-')) {
      return this.getMockProductDetails(itemId);
    }

    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + '+08:00';
      const params: Record<string, any> = {
        method: 'taobao.tbk.item.info.get',
        app_key: this.appKey,
        session: '',
        timestamp,
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        num_iids: itemId,
        platform: '1',
      };

      params.sign = this.generateSign(params);

      const response = await firstValueFrom(
        this.http.get(this.apiUrl, { params }),
      );

      if (response.data?.error_response) {
        this.logger.warn(`Taobao item details error: ${JSON.stringify(response.data.error_response)}`);
        return this.getMockProductDetails(itemId);
      }

      const item = response.data?.tbk_item_info_get_response?.results?.n_tbk_item?.[0];
      
      if (!item) {
        return this.getMockProductDetails(itemId);
      }

      return {
        id: item.num_iid || itemId,
        title: item.title || 'Товар Taobao',
        price_cny: parseFloat(item.zk_final_price || item.reserve_price || '0'),
        images: item.pict_url ? [item.pict_url] : ['https://picsum.photos/400/400'],
        rating: 4.5,
        sales: parseInt(item.volume || '0', 10),
        mock: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get product details: ${error.message}`);
      return this.getMockProductDetails(itemId);
    }
  }

  private getMockProducts(query: string) {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `mock-${i + 1}`,
      title: `Taobao ${query || 'item'} #${i + 1}`,
      price_cny: 49 + i * 10,
      images: [
        `https://picsum.photos/seed/${i + 1}/400/400`,
        `https://picsum.photos/seed/${i + 100}/400/400`,
      ],
      rating: 3.5 + Math.random() * 1.5,
      sales: Math.floor(Math.random() * 2000) + 100,
      mock: true,
    }));
  }

  private getMockProductDetails(id: string) {
    const num = parseInt(id.replace('mock-', '')) || 1;
    return {
      id,
      title: `Taobao item #${num}`,
      price_cny: 49 + num * 10,
      images: [
        `https://picsum.photos/seed/${num}/400/400`,
        `https://picsum.photos/seed/${num + 100}/400/400`,
        `https://picsum.photos/seed/${num + 200}/400/400`,
      ],
      rating: 4.2,
      sales: 1500,
      mock: true,
    };
  }
}

