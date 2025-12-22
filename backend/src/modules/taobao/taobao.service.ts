import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class TaobaoService {
  private readonly logger = new Logger(TaobaoService.name);
  private readonly appKey = process.env.TAOBAO_APP_KEY || '503900';
  private readonly appSecret = process.env.TAOBAO_APP_SECRET || 'AGx46GnoC0f7UqwdBaY7ZsFqFRCIk0te';
  private readonly apiUrl = 'https://api.taobao.global/rest';
  private readonly mode = process.env.TAOBAO_MODE || 'PROD';

  constructor(private readonly http: HttpService) {}

  private generateSign(apiPath: string, params: Record<string, any>): string {
    // TaoWorld uses HMAC-SHA256 (not MD5!) and includes API path in signature
    // Format: apiPath + key1 + value1 + key2 + value2... (sorted by key)
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('');
    const signString = apiPath + sorted;
    const sign = crypto
      .createHmac('sha256', this.appSecret)
      .update(signString)
      .digest('hex')
      .toUpperCase();
    return sign;
  }

  async searchProducts(query: string, page = 1, pageSize = 20) {
    if (this.mode === 'MOCK') {
      return this.getMockProducts(query);
    }

    try {
      // TaoWorld Global Supply Platform API - /product/spus/get
      // Docs: https://open.taobao.global/doc/api.htm#/api?cid=4&path=/product/spus/get
      // Note: This works WITHOUT access_token for already distributed products
      const timestamp = Date.now().toString();
      const apiPath = '/product/spus/get';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        page_size: pageSize.toString(),
        page_no: page.toString(),
      };

      // TaoWorld signature: API_PATH + sorted params
      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld API: ${apiPath}`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.error_code && response.data?.error_code !== '0') {
        this.logger.warn(`TaoWorld API error: ${JSON.stringify(response.data)}, falling back to mock`);
        return this.getMockProducts(query);
      }

      const productList = response.data?.data?.product_list || [];
      
      if (!Array.isArray(productList) || productList.length === 0) {
        this.logger.log('TaoWorld returned no distributed products, using mocks');
        return this.getMockProducts(query);
      }

      this.logger.log(`TaoWorld returned ${productList.length} distributed products`);
      
      // Filter by query if provided
      let filteredList = productList;
      if (query) {
        filteredList = productList.filter((item: any) => 
          (item.title || item.cn_title || '').toLowerCase().includes(query.toLowerCase())
        );
      }

      return filteredList.slice(0, pageSize).map((item: any) => ({
        id: item.item_id || `tw-${Date.now()}-${Math.random()}`,
        title: item.title || item.cn_title || 'TaoWorld Product',
        price_cny: parseFloat(item.price || '0') / 100, // TaoWorld prices in cents
        images: item.images ? JSON.parse(item.images) : ['https://picsum.photos/400/400'],
        rating: parseFloat(item.material_quality_score || '0') / 20 || 4.0, // Score 0-100 -> rating 0-5
        sales: 0, // Not provided in spus/get
        mock: false,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch from TaoWorld API: ${error.message}`, error.stack);
      return this.getMockProducts(query);
    }
  }

  async getProductDetails(itemId: string) {
    if (this.mode === 'MOCK' || itemId.startsWith('mock-')) {
      return this.getMockProductDetails(itemId);
    }

    try {
      // TaoWorld API: /product/details/query
      // Docs: https://open.taobao.global/doc/api.htm#/api?cid=4&path=/product/details/query
      const timestamp = Date.now().toString();
      const apiPath = '/product/details/query';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        item_id_list: JSON.stringify([itemId]),
      };

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld ${apiPath} for ${itemId}`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.error_code && response.data?.error_code !== '0') {
        this.logger.warn(`TaoWorld item details error: ${JSON.stringify(response.data)}`);
        return this.getMockProductDetails(itemId);
      }

      const item = response.data?.data?.goods_info_list?.[0];
      
      if (!item) {
        this.logger.log('No item data in response, using mock');
        return this.getMockProductDetails(itemId);
      }

      this.logger.log(`Successfully fetched TaoWorld item ${itemId}`);
      return {
        id: item.item_id || itemId,
        title: item.title || item.short_title || 'TaoWorld Product',
        price_cny: parseFloat(item.price || '0') / 100, // Price in cents
        images: item.images || ['https://picsum.photos/400/400'],
        rating: 4.5,
        sales: item.inventory || 0,
        mock: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get TaoWorld product details: ${error.message}`);
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

