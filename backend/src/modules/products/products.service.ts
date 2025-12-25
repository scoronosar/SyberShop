import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { TaobaoService } from '../taobao/taobao.service';

type ProductData = {
  id: string;
  title: string;
  price_cny: number;
  rating?: number;
  sales?: number;
  images: string[];
  mock?: boolean;

  // optional fields for product detail (see taobao service + Taobao docs)
  inventory?: number;
  description?: string;
  category?: string;
  brand?: string;
  shop_name?: string;
  video_url?: string;
  sku_list?: any[];
  properties?: any[];
  multi_language_info?: any;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currency: CurrencyService,
    private readonly taobao: TaobaoService,
  ) {}

  async search(params: {
    query?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    availability?: string;
    currency?: string;
    page?: number;
    language?: string;
  }) {
    const page = params.page || 1;
    const pageSize = 20;
    
    // Map frontend language codes to Taobao API language codes
    const languageMap: Record<string, string> = {
      'en': 'en',
      'ru': 'ru',
      'vi': 'vi',
      'ko': 'ko',
      'ja': 'ja',
    };
    const apiLanguage = params.language && languageMap[params.language] ? languageMap[params.language] : undefined;
    
    let items = await this.taobao.searchProducts(params.query || '', page, pageSize, apiLanguage);

    // Get accurate prices from product details for each item (parallel requests)
    // This ensures we show the cheapest SKU price, matching the main page behavior
    const itemsWithAccuratePrices = await Promise.all(
      items.map(async (item) => {
        try {
          const details = await this.taobao.getProductDetails(item.id, apiLanguage);
          if (details && details.price_cny < item.price_cny) {
            // Use the cheaper price from details (cheapest SKU)
            return { 
              ...item, 
              price_cny: details.price_cny, 
              title: details.title,
              multi_language_info: (details as any).multi_language_info || (item as any).multi_language_info || null
            };
          }
          return item;
        } catch (error) {
          // If getting details fails, use the original item
          return item;
        }
      })
    );

    let filteredItems = itemsWithAccuratePrices;

    if (params.priceMin) {
      const min = Number(params.priceMin);
      if (!Number.isNaN(min)) filteredItems = filteredItems.filter((p) => p.price_cny >= min);
    }
    if (params.priceMax) {
      const max = Number(params.priceMax);
      if (!Number.isNaN(max)) filteredItems = filteredItems.filter((p) => p.price_cny <= max);
    }
    if (params.availability === 'in_stock') {
      // Оставить фильтр для будущего расширения
    }

    if (params.sort === 'price_asc') {
      filteredItems = filteredItems.sort((a, b) => a.price_cny - b.price_cny);
    } else if (params.sort === 'price_desc') {
      filteredItems = filteredItems.sort((a, b) => b.price_cny - a.price_cny);
    } else if (params.sort === 'rating_desc') {
      filteredItems = filteredItems.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (params.sort === 'sales_desc') {
      filteredItems = filteredItems.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
    }

    return Promise.all(filteredItems.map((p) => this.enrichProduct(p, params.currency)));
  }

  async findOne(id: string, currency?: string, language?: string) {
    try {
      // Map frontend language codes to Taobao API language codes
      const languageMap: Record<string, string> = {
        'en': 'en',
        'ru': 'ru',
        'vi': 'vi',
        'ko': 'ko',
        'ja': 'ja',
      };
      const apiLanguage = language && languageMap[language] ? languageMap[language] : undefined;
      
      const item = await this.taobao.getProductDetails(id, apiLanguage);
      if (!item) {
        console.error(`Product ${id} not found or API returned null`);
        return null;
      }
      
      // Log if we got mock data
      if (item.mock) {
        console.warn(`Product ${id} returned as mock data - check OAuth token and API connection`);
      } else {
        console.log(`Product ${id} fetched successfully from Taobao API`);
      }
      
      try {
        return await this.enrichProduct(item, currency);
      } catch (enrichError) {
        console.error(`Error enriching product ${id}:`, enrichError);
        // Return basic product data without enrichment if enrichment fails
        const itemAny = item as any;
        return {
          id: item.id,
          title: item.title,
          price_cny: item.price_cny,
          images: item.images,
          rating: item.rating,
          sales: item.sales,
          inventory: itemAny.inventory,
          description: itemAny.description,
          category: itemAny.category,
          brand: itemAny.brand,
          shop_name: itemAny.shop_name,
          video_url: itemAny.video_url,
          sku_list: itemAny.sku_list,
          properties: itemAny.properties,
          multi_language_info: itemAny.multi_language_info,
          rate_used: 1,
          converted_with_markup: item.price_cny,
          service_fee_amount: 0,
          final_item_price: item.price_cny,
          mock: item.mock ?? false,
        };
      }
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      // Return null instead of throwing to prevent 500 error
      return null;
    }
  }

  async getRecommendations(productId: string, currency?: string, language?: string) {
    // Map frontend language codes to Taobao API language codes
    const languageMap: Record<string, string> = {
      'en': 'en',
      'ru': 'ru',
      'vi': 'vi',
      'ko': 'ko',
      'ja': 'ja',
    };
    const apiLanguage = language && languageMap[language] ? languageMap[language] : undefined;
    
    const items = await this.taobao.getRecommendedProducts(productId, apiLanguage);
    if (!items || items.length === 0) return [];
    
    // Enrich each recommended product with pricing
    return Promise.all(items.map((item) => this.enrichProduct(item, currency)));
  }

  async enrichProduct(item: ProductData, currency?: string) {
    try {
      // Clamp price to prevent DB overflow (Decimal(14,2) max value is 99999999999999.99)
      const maxPrice = 99999999999999.99;
      const safePriceCny = Math.min(Math.max(item.price_cny || 0, 0), maxPrice);
      
      // persist minimal product snapshot for cart/order relations
      await this.prisma.product.upsert({
        where: { externalId: item.id },
        update: {
          priceCny: safePriceCny,
          titleOrig: item.title,
          images: item.images,
          rating: item.rating,
          sales: item.sales,
        },
        create: {
          externalId: item.id,
          titleOrig: item.title,
          titleEn: item.title,
          priceCny: safePriceCny,
          images: item.images,
          rating: item.rating,
          sales: item.sales,
        },
      });
    } catch (dbError) {
      // Log but don't fail if DB operation fails
      console.error(`Error upserting product ${item.id} to DB:`, dbError);
    }

    let pricing;
    try {
      pricing = await this.currency.applyPricing(item.price_cny, currency);
    } catch (pricingError) {
      console.error(`Error applying pricing for product ${item.id}:`, pricingError);
      // Use default pricing if currency conversion fails
      pricing = {
        rate: 1,
        converted: item.price_cny,
        converted_with_markup: item.price_cny,
        service_fee_percent: 0,
        service_fee_amount: 0,
        final_per_item: item.price_cny,
      };
    }

    return {
      id: item.id,
      title: item.title,
      price_cny: item.price_cny,
      images: item.images,
      rating: item.rating,
      sales: item.sales,
      inventory: item.inventory,
      description: item.description,
      category: item.category,
      brand: item.brand,
      shop_name: item.shop_name,
      video_url: item.video_url,
      sku_list: item.sku_list,
      properties: item.properties,
      multi_language_info: item.multi_language_info,
      rate_used: pricing.rate,
      converted_with_markup: pricing.converted_with_markup,
      service_fee_amount: pricing.service_fee_amount,
      final_item_price: pricing.final_per_item,
      mock: item.mock ?? false,
    };
  }
}

