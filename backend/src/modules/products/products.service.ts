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
  }) {
    const page = params.page || 1;
    const pageSize = 20;
    let items = await this.taobao.searchProducts(params.query || '', page, pageSize);

    if (params.priceMin) {
      const min = Number(params.priceMin);
      if (!Number.isNaN(min)) items = items.filter((p) => p.price_cny >= min);
    }
    if (params.priceMax) {
      const max = Number(params.priceMax);
      if (!Number.isNaN(max)) items = items.filter((p) => p.price_cny <= max);
    }
    if (params.availability === 'in_stock') {
      // Оставить фильтр для будущего расширения
    }

    if (params.sort === 'price_asc') {
      items = items.sort((a, b) => a.price_cny - b.price_cny);
    } else if (params.sort === 'price_desc') {
      items = items.sort((a, b) => b.price_cny - a.price_cny);
    } else if (params.sort === 'rating_desc') {
      items = items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (params.sort === 'sales_desc') {
      items = items.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
    }

    return Promise.all(items.map((p) => this.enrichProduct(p, params.currency)));
  }

  async findOne(id: string, currency?: string) {
    const item = await this.taobao.getProductDetails(id);
    if (!item) return null;
    return this.enrichProduct(item, currency);
  }

  private async enrichProduct(item: ProductData, currency?: string) {
    // persist minimal product snapshot for cart/order relations
    await this.prisma.product.upsert({
      where: { externalId: item.id },
      update: {
        priceCny: item.price_cny,
        titleOrig: item.title,
        images: item.images,
        rating: item.rating,
        sales: item.sales,
      },
      create: {
        externalId: item.id,
        titleOrig: item.title,
        titleEn: item.title,
        priceCny: item.price_cny,
        images: item.images,
        rating: item.rating,
        sales: item.sales,
      },
    });

    const pricing = await this.currency.applyPricing(item.price_cny, currency);
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
      rate_used: pricing.rate,
      converted_with_markup: pricing.converted_with_markup,
      service_fee_amount: pricing.service_fee_amount,
      final_item_price: pricing.final_per_item,
      mock: item.mock ?? false,
    };
  }
}

