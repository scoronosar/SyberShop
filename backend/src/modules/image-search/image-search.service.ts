import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OAuthService } from '../oauth/oauth.service';
import * as crypto from 'crypto';

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);
  private readonly appKey = process.env.TAOBAO_APP_KEY || '';
  private readonly appSecret = process.env.TAOBAO_APP_SECRET || '';
  private readonly apiUrl = 'https://api.taobao.global/rest';

  constructor(
    private readonly http: HttpService,
    private readonly oauthService: OAuthService,
  ) {}

  /**
   * Upload image to TaoWorld and get image_id
   * Docs: https://open.taobao.global/doc/api.htm#/api?path=/upload/image
   */
  async uploadImage(base64Image: string): Promise<string | null> {
    try {
      const accessToken = await this.oauthService.getValidAccessToken();
      if (!accessToken) {
        this.logger.warn('No OAuth token for image upload');
        return null;
      }

      const timestamp = Date.now().toString();
      const apiPath = '/upload/image';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        access_token: accessToken,
        image_base64: base64Image,
      };

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Uploading image to TaoWorld...`);
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}${apiPath}`, null, { params, timeout: 15000 }),
      );

      if (response.data?.biz_error_code) {
        this.logger.error(`Image upload failed: ${JSON.stringify(response.data)}`);
        return null;
      }

      const imageId = response.data?.data?.image_id;
      this.logger.log(`✓ Image uploaded, ID: ${imageId}`);
      return imageId;
    } catch (error) {
      this.logger.error(`Failed to upload image: ${error.message}`);
      return null;
    }
  }

  /**
   * Search products by image with advanced options
   * Docs: https://open.taobao.global/doc/api.htm#/api?path=/traffic/item/imgsearch
   * 
   * @param imageId - Image ID from upload
   * @param picUrl - Direct image URL
   * @param includeTags - Filter by activity tags (e.g., ["activity_202311_1_tb_manjian"])
   * @param language - Multi-language support: en|vi|ru|ko|ja
   */
  async searchByImage(
    imageId?: string,
    picUrl?: string,
    includeTags?: string[],
    language?: string,
  ) {
    try {
      const accessToken = await this.oauthService.getValidAccessToken();
      if (!accessToken) {
        this.logger.warn('No OAuth token for image search');
        return [];
      }

      const timestamp = Date.now().toString();
      const apiPath = '/traffic/item/imgsearch';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        access_token: accessToken,
      };

      if (imageId) {
        params.image_id = imageId;
      } else if (picUrl) {
        params.pic_url = picUrl;
      } else {
        this.logger.warn('No image_id or pic_url provided');
        return [];
      }

      // Advanced parameters
      if (includeTags && includeTags.length > 0) {
        params.include_tags = JSON.stringify(includeTags);
      }

      if (language && ['en', 'vi', 'ru', 'ko', 'ja'].includes(language)) {
        params.language = language;
      }

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Searching products by image (tags: ${includeTags?.join(',') || 'none'}, lang: ${language || 'default'})...`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 15000 }),
      );

      if (response.data?.biz_error_code || response.data?.code !== '0') {
        this.logger.error(`Image search failed: ${JSON.stringify(response.data)}`);
        return [];
      }

      const items = response.data?.data || [];
      this.logger.log(`✓ Found ${items.length} products by image`);

      const toFen = (val: any): number => {
        if (val == null) return 0;
        const s = String(val).trim();
        if (!s) return 0;
        const n = Number.parseFloat(s);
        return Number.isFinite(n) ? n : 0;
      };

      return items.map((item: any) => {
        // Use coupon_price if available (more accurate), otherwise use price
        const priceYuan = toFen(item.coupon_price || item.price || '0');
        
        return {
          id: item.item_id?.toString(),
          title: item.title,
          // Use multi_language_info if available
          title_translated: item.multi_language_info?.title || item.title,
          price_cny: priceYuan,
          coupon_price_cny: item.coupon_price ? toFen(item.coupon_price) : null,
          images: [item.main_image_url || item.multi_language_info?.main_image_url],
          shop_name: item.shop_name,
          inventory: parseInt(item.inventory || '0', 10),
          rating: 4.5,
          sales: 0,
          tags: item.tags || [],
          promotion_displays: item.promotion_displays || [],
          multi_language_info: item.multi_language_info || null,
          mock: false,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to search by image: ${error.message}`);
      return [];
    }
  }

  private generateSign(apiPath: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('');
    const signString = apiPath + sorted;
    return crypto
      .createHmac('sha256', this.appSecret)
      .update(signString)
      .digest('hex')
      .toUpperCase();
  }
}

