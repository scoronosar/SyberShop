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
      // TaoWorld Global Supply Platform API
      // Try multiple methods for compatibility
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('Z', '') + '+0800';
      
      // Try method 1: taobao.items.list.get (standard Taobao method)
      const params: Record<string, any> = {
        method: 'taobao.items.list.get',
        app_key: this.appKey,
        timestamp,
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        fields: 'num_iid,title,nick,pic_url,price,approve_status',
        page_size: pageSize.toString(),
        page_no: page.toString(),
      };

      if (query) {
        params.q = query;
      }

      params.sign = this.generateSign(params);

      this.logger.log(`Calling TaoWorld API: ${params.method}`);
      const response = await firstValueFrom(
        this.http.get(this.apiUrl, { params, timeout: 10000 }),
      );

      if (response.data?.error_response) {
        this.logger.warn(`TaoWorld API error: ${JSON.stringify(response.data.error_response)}, falling back to mock`);
        return this.getMockProducts(query);
      }

      // Parse response - try multiple structures
      let items = response.data?.items_list_get_response?.items?.item || 
                  response.data?.data?.item_list ||
                  response.data?.item_search_response?.items?.n_item ||
                  [];
      
      if (items.length === 0) {
        this.logger.log('TaoWorld/Taobao API returned no items, using mocks');
        return this.getMockProducts(query);
      }

      this.logger.log(`TaoWorld/Taobao API returned ${items.length} items`);
      return items.map((item: any) => ({
        id: item.num_iid || item.item_id || item.goods_id || `tw-${Date.now()}-${Math.random()}`,
        title: item.title || item.goods_name || 'Taobao Product',
        price_cny: parseFloat(item.price || item.sale_price || item.zk_final_price || '0'),
        images: [item.pic_url || item.pict_url || item.image_url || 'https://picsum.photos/400/400'],
        rating: item.user_type ? 4.5 : 4.0,
        sales: parseInt(item.volume || item.sales || '0', 10),
        mock: false,
      }));
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
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('Z', '') + '+0800';
      const params: Record<string, any> = {
        method: 'taobao.item.get',
        app_key: this.appKey,
        timestamp,
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        fields: 'num_iid,title,nick,pic_url,price,detail_url,volume,approve_status',
        num_iid: itemId,
      };

      params.sign = this.generateSign(params);

      this.logger.log(`Calling Taobao item.get for ${itemId}`);
      const response = await firstValueFrom(
        this.http.get(this.apiUrl, { params, timeout: 10000 }),
      );

      if (response.data?.error_response) {
        this.logger.warn(`Taobao item details error: ${JSON.stringify(response.data.error_response)}`);
        return this.getMockProductDetails(itemId);
      }

      const item = response.data?.item_get_response?.item;
      
      if (!item) {
        this.logger.log('No item data in response, using mock');
        return this.getMockProductDetails(itemId);
      }

      this.logger.log(`Successfully fetched item ${itemId}`);
      return {
        id: item.num_iid || itemId,
        title: item.title || 'Taobao Product',
        price_cny: parseFloat(item.price || '0'),
        images: item.pic_url ? [item.pic_url] : ['https://picsum.photos/400/400'],
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

