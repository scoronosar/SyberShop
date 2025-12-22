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
   * Search products by image
   * Docs: https://open.taobao.global/doc/api.htm#/api?path=/traffic/item/imgsearch
   */
  async searchByImage(imageId?: string, picUrl?: string) {
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

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Searching products by image...`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 15000 }),
      );

      if (response.data?.biz_error_code || response.data?.code !== '0') {
        this.logger.error(`Image search failed: ${JSON.stringify(response.data)}`);
        return [];
      }

      const items = response.data?.data || [];
      this.logger.log(`✓ Found ${items.length} products by image`);

      return items.map((item: any) => ({
        id: item.item_id?.toString(),
        title: item.title,
        price_cny: parseFloat(item.price || '0') / 100,
        images: [item.main_image_url],
        shop_name: item.shop_name,
        inventory: item.inventory,
        rating: 4.5,
        sales: 0,
        mock: false,
      }));
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

