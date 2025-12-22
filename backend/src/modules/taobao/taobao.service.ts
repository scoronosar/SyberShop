import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { OAuthService } from '../oauth/oauth.service';

@Injectable()
export class TaobaoService {
  private readonly logger = new Logger(TaobaoService.name);
  private readonly appKey = process.env.TAOBAO_APP_KEY || '503900';
  private readonly appSecret = process.env.TAOBAO_APP_SECRET || 'AGx46GnoC0f7UqwdBaY7ZsFqFRCIk0te';
  private readonly apiUrl = 'https://api.taobao.global/rest';
  private readonly mode = process.env.TAOBAO_MODE || 'PROD';

  constructor(
    private readonly http: HttpService,
    private readonly oauthService: OAuthService,
  ) {}

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

    // Get valid access token from OAuth
    const accessToken = await this.oauthService.getValidAccessToken();
    
    if (!accessToken) {
      this.logger.warn('No valid TaoWorld OAuth token, using mock data. Please connect TaoWorld account in admin panel.');
      return this.getMockProducts(query);
    }

    try {
      // TaoWorld Traffic API - /traffic/item/search (requires access_token)
      // Docs: https://open.taobao.global/doc/api.htm#/api?path=/traffic/item/search
      const timestamp = Date.now().toString();
      const apiPath = '/traffic/item/search';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        page_no: page.toString(),
        page_size: pageSize.toString(),
        access_token: accessToken,
      };

      if (query) {
        params.keyword = query;
      }

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld Traffic Search API: ${apiPath} keyword="${query}"`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.biz_error_code || (response.data?.code && response.data.code !== '0')) {
        this.logger.warn(`TaoWorld Traffic API error: ${JSON.stringify(response.data)}, falling back to mock`);
        return this.getMockProducts(query);
      }

      const items = response.data?.data?.data || [];
      
      if (!Array.isArray(items) || items.length === 0) {
        this.logger.log('TaoWorld Traffic API returned no items, using mocks');
        return this.getMockProducts(query);
      }

      this.logger.log(`TaoWorld Traffic API returned ${items.length} real Taobao items!`);
      
      return items.map((item: any) => ({
        id: item.item_id?.toString() || `tw-${Date.now()}-${Math.random()}`,
        title: item.title || 'Taobao Product',
        price_cny: parseFloat(item.price || '0') / 100, // Price in cents
        images: [item.main_image_url || 'https://picsum.photos/400/400'],
        rating: 4.5,
        sales: item.inventory || 0,
        mock: false,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch from TaoWorld Traffic API: ${error.message}`, error.stack);
      return this.getMockProducts(query);
    }
  }

  async getProductDetails(itemId: string) {
    if (this.mode === 'MOCK' || itemId.startsWith('mock-')) {
      return this.getMockProductDetails(itemId);
    }

    // Get valid access token from OAuth
    const accessToken = await this.oauthService.getValidAccessToken();
    
    if (!accessToken) {
      this.logger.warn('No valid TaoWorld OAuth token, using mock data. Please connect TaoWorld account in admin panel.');
      return this.getMockProductDetails(itemId);
    }

    try {
      // TaoWorld Traffic API: /traffic/item/get (requires access_token)
      // Docs: https://open.taobao.global/doc/api.htm#/api?path=/traffic/item/get
      const timestamp = Date.now().toString();
      const apiPath = '/traffic/item/get';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        item_resource: 'taobao',
        item_id: itemId,
        access_token: accessToken,
      };

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld Traffic item.get for ${itemId}`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.biz_error_code || (response.data?.code && response.data.code !== '0')) {
        this.logger.warn(`TaoWorld Traffic item error: ${JSON.stringify(response.data)}`);
        return this.getMockProductDetails(itemId);
      }

      const item = response.data?.data;
      
      if (!item) {
        this.logger.log('No item data in response, using mock');
        return this.getMockProductDetails(itemId);
      }

      this.logger.log(`Successfully fetched real Taobao item ${itemId}`);
      return {
        id: item.item_id?.toString() || itemId,
        title: item.title || 'Taobao Product',
        price_cny: parseFloat(item.price || item.promotion_price || '0') / 100, // Price in cents
        images: item.pic_urls || [item.main_image_url] || ['https://picsum.photos/400/400'],
        rating: 4.5,
        sales: item.sku_list?.reduce((sum: number, sku: any) => sum + (sku.quantity || 0), 0) || 0,
        mock: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get TaoWorld Traffic item: ${error.message}`);
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

