import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';

type MockProduct = {
  id: string;
  title: string;
  priceCny: number;
  rating: number;
  sales: number;
  images: string[];
};

const MOCK_DATA: MockProduct[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `mock-${i + 1}`,
  title: `Taobao item #${i + 1}`,
  priceCny: 49 + i * 5,
  rating: 3.5 + (i % 15) / 10,
  sales: 800 + i * 70,
  images: [
    `https://picsum.photos/seed/${i + 1}/400/400`,
    `https://picsum.photos/seed/${i + 100}/400/400`,
  ],
}));

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currency: CurrencyService,
  ) {}

  async search(params: {
    query?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    availability?: string;
    currency?: string;
  }) {
    let items = MOCK_DATA.filter((p) =>
      params.query ? p.title.toLowerCase().includes(params.query.toLowerCase()) : true,
    );

    if (params.priceMin) {
      const min = Number(params.priceMin);
      if (!Number.isNaN(min)) items = items.filter((p) => p.priceCny >= min);
    }
    if (params.priceMax) {
      const max = Number(params.priceMax);
      if (!Number.isNaN(max)) items = items.filter((p) => p.priceCny <= max);
    }
    if (params.availability === 'in_stock') {
      // В моках считаем все в наличии; оставить фильтр для будущего.
    }

    if (params.sort === 'price_asc') {
      items = items.sort((a, b) => a.priceCny - b.priceCny);
    } else if (params.sort === 'price_desc') {
      items = items.sort((a, b) => b.priceCny - a.priceCny);
    } else if (params.sort === 'rating_desc') {
      items = items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (params.sort === 'sales_desc') {
      items = items.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
    }

    return Promise.all(items.map((p) => this.enrichProduct(p, params.currency)));
  }

  async findOne(id: string, currency?: string) {
    const mock = MOCK_DATA.find((p) => p.id === id);
    if (!mock) return null;
    return this.enrichProduct(mock, currency);
  }

  private async enrichProduct(mock: MockProduct, currency?: string) {
    // persist minimal product snapshot for cart/order relations
    await this.prisma.product.upsert({
      where: { externalId: mock.id },
      update: {
        priceCny: mock.priceCny,
        titleOrig: mock.title,
        images: mock.images,
        rating: mock.rating,
        sales: mock.sales,
      },
      create: {
        externalId: mock.id,
        titleOrig: mock.title,
        titleEn: mock.title,
        priceCny: mock.priceCny,
        images: mock.images,
        rating: mock.rating,
        sales: mock.sales,
      },
    });

    const pricing = await this.currency.applyPricing(mock.priceCny, currency);
    return {
      id: mock.id,
      title: mock.title,
      price_cny: mock.priceCny,
      images: mock.images,
      rating: mock.rating,
      sales: mock.sales,
      rate_used: pricing.rate,
      converted_with_markup: pricing.converted_with_markup,
      service_fee_amount: pricing.service_fee_amount,
      final_item_price: pricing.final_per_item,
      mock: true,
    };
  }
}

