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

  async searchProducts(query: string, page = 1, pageSize = 20, language?: string) {
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
      // If no query, show mixed recommendations from multiple categories
      if (!query) {
        try {
          const mixed = await this.getMixedRecommendations(page, pageSize, accessToken, language);
          if (mixed && mixed.length > 0) {
            return mixed;
          }
          this.logger.warn('getMixedRecommendations returned empty, falling back to single keyword');
        } catch (mixErr) {
          this.logger.error(`getMixedRecommendations failed: ${mixErr.message}`, mixErr.stack);
        }
        // Fallback to single keyword search if mix fails
      }

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
        keyword: query,
        sort: 'SALE_QTY_DESC', // Sort by sales for better recommendations
      };

      // Add language parameter if provided (en|vi|ru|ko|ja)
      if (language && ['en', 'vi', 'ru', 'ko', 'ja'].includes(language)) {
        params.language = language;
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

      this.logger.log(`✓ TaoWorld API returned ${items.length} REAL products!`);
      
      const toFen = (v: any): number => {
        if (v === null || v === undefined) return 0;
        const s = String(v).trim();
        if (!s) return 0;
        // If price looks like decimal in yuan, convert to fen.
        if (s.includes('.')) {
          const f = Number.parseFloat(s);
          return Number.isFinite(f) ? Math.round(f * 100) : 0;
        }
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : 0;
      };
      
      return items.map((item: any) => {
        // Use coupon_price if available (most accurate), otherwise use price
        // Note: Search API returns prices in "fen" (cents), need to divide by 100 to get yuan
        // The actual cheapest SKU price will be calculated in getProductDetails
        const priceFen = toFen(item.coupon_price || item.price || '0');
        const priceYuan = priceFen / 100; // Convert from fen to yuan
        
        // Use multi_language_info if available for translated title
        const multiLang = item.multi_language_info;
        const title = multiLang?.title || item.title || 'Taobao Product';
        const imageUrl = multiLang?.main_image_url || item.main_image_url || 'https://picsum.photos/400/400';
        
        return {
        id: item.item_id?.toString() || `tw-${Date.now()}-${Math.random()}`,
          title,
          price_cny: priceYuan,
          images: [imageUrl],
        rating: 4.5,
        sales: item.inventory || 0,
          coupon_price_cny: item.coupon_price ? toFen(item.coupon_price) / 100 : null,
          multi_language_info: multiLang || null,
        mock: false,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch from TaoWorld Traffic API: ${error.message}`, error.stack);
      return this.getMockProducts(query);
    }
  }

  /**
   * Get mixed recommendations from multiple categories for main page
   * Shows diverse products from different categories
   */
  private async getMixedRecommendations(page: number, pageSize: number, accessToken: string, language?: string) {
    const keywords = this.getRecommendationKeywords();
    const timestamp = Date.now().toString();
    const apiPath = '/traffic/item/search';
    
    // For pagination: rotate through keywords based on page
    const numKeywords = 3;
    const keywordOffset = (page - 1) * numKeywords;
    const selectedKeywords = keywords.slice(keywordOffset % keywords.length, (keywordOffset + numKeywords) % keywords.length);
    
    // If we went past the end, wrap around
    if (selectedKeywords.length < numKeywords) {
      selectedKeywords.push(...keywords.slice(0, numKeywords - selectedKeywords.length));
    }
    
    const itemsPerKeyword = Math.ceil(pageSize / selectedKeywords.length);
    
    this.logger.log(`Fetching mixed recs (page ${page}): keywords=[${selectedKeywords.join(', ')}]`);
    
    const promises = selectedKeywords.map(async (keyword, idx) => {
      try {
        const params: Record<string, any> = {
          app_key: this.appKey,
          timestamp: (Number(timestamp) + idx * 100).toString(), // Unique timestamp per request
          sign_method: 'sha256',
          page_no: '1',
          page_size: itemsPerKeyword.toString(),
          access_token: accessToken,
          keyword,
          sort: 'SALE_QTY_DESC',
        };

        // Add language parameter if provided (en|vi|ru|ko|ja)
        if (language && ['en', 'vi', 'ru', 'ko', 'ja'].includes(language)) {
          params.language = language;
        }

        params.sign = this.generateSign(apiPath, params);

        const response = await firstValueFrom(
          this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 8000 }),
        );

        const items = response.data?.data?.data || [];
        this.logger.log(`  - Keyword "${keyword}": ${items.length} items`);
        return items;
      } catch (err) {
        this.logger.warn(`Failed to fetch for keyword "${keyword}": ${err.message}`);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allItems = results.flat();
    
    if (allItems.length === 0) {
      this.logger.warn('getMixedRecommendations: no items from any keyword, returning empty');
      return [];
    }
    
    // Shuffle to mix categories
    const shuffled = this.shuffleArray(allItems);
    const limited = shuffled.slice(0, pageSize);
    
    this.logger.log(`✓ Mixed recommendations: ${limited.length} items from ${selectedKeywords.length} categories`);
    
    // Use the same toFen logic as searchProducts to handle prices correctly
    const toFen = (v: any): number => {
      if (v === null || v === undefined) return 0;
      const s = String(v).trim();
      if (!s) return 0;
      // If price looks like decimal in yuan, convert to fen.
      if (s.includes('.')) {
        const f = Number.parseFloat(s);
        return Number.isFinite(f) ? Math.round(f * 100) : 0;
      }
      const n = Number.parseInt(s, 10);
      return Number.isFinite(n) ? n : 0;
    };
    
    return limited.map((item: any) => {
      // Use coupon_price if available (most accurate), otherwise use price
      // Note: For mixed recommendations (main page), API returns prices already in yuan
      // For search results, we divide by 100 to convert from fen to yuan
      const rawPrice = item.coupon_price || item.price || '0';
      // Parse price directly as yuan (no conversion needed for main page)
      const priceYuan = toFen(rawPrice);
      
      // Use multi_language_info if available for translated title
      const multiLang = item.multi_language_info;
      const title = multiLang?.title || item.title || 'Taobao Product';
      const imageUrl = multiLang?.main_image_url || item.main_image_url || 'https://picsum.photos/400/400';
      
      return {
        id: item.item_id?.toString() || `tw-${Date.now()}-${Math.random()}`,
        title,
        price_cny: priceYuan,
        images: [imageUrl],
        rating: 4.5,
        sales: item.inventory || 0,
        coupon_price_cny: item.coupon_price ? toFen(item.coupon_price) : null,
        multi_language_info: multiLang || null,
        mock: false,
      };
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getRecommendationKeywords(): string[] {
    return [
      // Trending & Popular
      '爆款热销',    // Best sellers
      '新品上市',    // New arrivals
      '人气推荐',    // Popular recommendations
      
      // Electronics & Digital
      '数码产品',    // Digital products
      '手机配件',    // Phone accessories
      '电脑办公',    // Computer & Office
      '智能设备',    // Smart devices
      
      // Fashion
      '时尚女装',    // Women's fashion
      '潮流男装',    // Men's fashion
      '运动服饰',    // Sportswear
      
      // Home & Living
      '家居用品',    // Home goods
      '厨房用品',    // Kitchen supplies
      '家居装饰',    // Home decor
      
      // Beauty & Health
      '美妆护肤',    // Beauty & Skincare
      '个护健康',    // Personal care
      
      // Accessories & More
      '包包饰品',    // Bags & Accessories
      '创意礼品',    // Creative gifts
      '运动户外',    // Sports & Outdoors
      '母婴用品',    // Baby products
      '食品零食',    // Snacks
      '宠物用品',    // Pet supplies
    ];
  }


  async getProductDetails(itemId: string, language?: string) {
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

      // Add language parameter if provided (en|vi|ru|ko|ja)
      if (language && ['en', 'vi', 'ru', 'ko', 'ja'].includes(language)) {
        params.language = language;
      }

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld Traffic item.get for ${itemId} with language=${language || 'none'}`);
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      this.logger.debug(`TaoWorld Traffic item.get response for ${itemId}:`, JSON.stringify({
        code: response.data?.code,
        biz_error_code: response.data?.biz_error_code,
        biz_error_msg: response.data?.biz_error_msg,
        has_data: !!response.data?.data,
        data_keys: response.data?.data ? Object.keys(response.data.data) : [],
      }));

      if (response.data?.biz_error_code) {
        this.logger.warn(`TaoWorld Traffic item biz_error: ${response.data.biz_error_code} - ${response.data.biz_error_msg || 'Unknown error'}`);
        // Don't return mock for business errors - return null so frontend can handle it
        return null;
      }

      if (response.data?.code && response.data.code !== '0') {
        this.logger.warn(`TaoWorld Traffic item error code: ${response.data.code}, message: ${response.data.error_msg || 'Unknown'}`);
        return null;
      }

      const item = response.data?.data;
      
      if (!item) {
        this.logger.warn(`No item data in response for ${itemId}, response structure:`, JSON.stringify(response.data));
        return null;
      }

      if (!item.item_id && !itemId) {
        this.logger.warn(`Item ${itemId} has no item_id in response`);
        return null;
      }

      this.logger.log(`✓ Successfully fetched REAL Taobao item ${itemId} with full details`);
      
      // Use multi_language_info if available for translated content
      const multiLang = item.multi_language_info;
      
      // Extract images from pic_urls or fallback to main_image_url (use translated image if available)
      const images = item.pic_urls || (multiLang?.main_image_url || item.main_image_url ? [multiLang?.main_image_url || item.main_image_url] : ['https://picsum.photos/400/400']);
      
      // Calculate total inventory from SKUs
      const totalInventory = item.sku_list?.reduce((sum: number, sku: any) => sum + (parseInt(sku.quantity) || 0), 0) || item.inventory || 0;

      // Prefer cheapest SKU price (Taobao sku_list prices are in "fen"), fall back to item.price/promotion_price.
      const skuList: any[] = Array.isArray(item.sku_list) ? item.sku_list : [];
      const skuMinFen = skuList.reduce((min: number, sku: any) => {
        const fen =
          parseInt(sku?.coupon_price ?? sku?.promotion_price ?? sku?.price ?? '0', 10) || 0;
        if (!fen) return min;
        return min === 0 ? fen : Math.min(min, fen);
      }, 0);
      const itemFen = parseInt(item.price || item.promotion_price || '0', 10) || 0;
      const baseFen = skuMinFen || itemFen;
      
      // Use translated title and description if available
      const title = multiLang?.title || item.title || 'Taobao Product';
      const description = item.description || item.desc || '';
      
      // Use translated properties if available
      const properties = multiLang?.properties || item.props_list || item.properties || [];
      
      return {
        id: item.item_id?.toString() || itemId,
        title,
        price_cny: baseFen / 100, // Price in "fen"
        images,
        rating: 4.5,
        sales: item.sell_number || totalInventory,
        inventory: totalInventory,
        description,
        category: item.category_name || '',
        brand: item.brand_name || '',
        shop_name: item.shop_name || item.seller_nick || '',
        video_url: item.video_url || '',
        sku_list: item.sku_list || [],
        properties,
        multi_language_info: multiLang || null,
        mock: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get TaoWorld Traffic item: ${error.message}`);
      return this.getMockProductDetails(itemId);
    }
  }

  /**
   * Get recommended similar products for a given product ID
   */
  async getRecommendedProducts(itemId: string, language?: string) {
    if (this.mode === 'MOCK') {
      return this.getMockProducts('');
    }

    const accessToken = await this.oauthService.getValidAccessToken();
    if (!accessToken) {
      this.logger.warn('No valid TaoWorld OAuth token for recommendations, using mock data');
      return this.getMockProducts('');
    }

    try {
      const timestamp = Date.now().toString();
      const apiPath = '/product/recommend';
      
      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        access_token: accessToken,
        itemId,
      };

      // Add language parameter if provided
      if (language && ['en', 'vi', 'ru', 'ko', 'ja'].includes(language)) {
        params.language = language;
      }

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Calling TaoWorld Recommend API: ${apiPath} for itemId=${itemId}`);
      
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.error_code && response.data.error_code !== '0') {
        this.logger.warn(`TaoWorld Recommend API error: ${response.data.error_msg}`);
        return [];
      }

      const items = response.data?.data || [];
      this.logger.log(`✓ Got ${items.length} recommended products for itemId=${itemId}`);

      const toFen = (val: any) => {
        if (val == null) return 0;
        const str = val.toString();
        const n = Number.parseFloat(str);
        return Number.isFinite(n) ? n : 0;
      };

      return items.map((item: any) => {
        // API returns prices in "fen" (cents), need to divide by 100 to get yuan
        const priceFen = toFen(item.price || '0');
        const priceYuan = priceFen / 100; // Convert from fen to yuan
        
        const multiLang = item.multi_language_info;
        const title = multiLang?.title || item.title || 'Taobao Product';
        const imageUrl = item.pic_urls?.[0] || item.pic_url || 'https://picsum.photos/400/400';

        return {
          id: item.item_id?.toString() || `tw-${Date.now()}-${Math.random()}`,
          title,
          price_cny: priceYuan,
          images: Array.isArray(item.pic_urls) ? item.pic_urls : [imageUrl],
          rating: 4.5,
          sales: item.inventory || 0,
          multi_language_info: multiLang || null,
          mock: false,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed to get recommended products: ${error.message}`, error.stack);
      return [];
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

