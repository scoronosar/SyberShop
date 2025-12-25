import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Query('query') query?: string,
    @Query('sort') sort?: string,
    @Query('price_min') priceMin?: string,
    @Query('price_max') priceMax?: string,
    @Query('availability') availability?: string,
    @Query('currency') currency?: string,
    @Query('page') page?: string,
    @Query('language') language?: string,
  ) {
    return this.products.search({
      query,
      sort,
      priceMin,
      priceMax,
      availability,
      currency,
      page: page ? parseInt(page, 10) : undefined,
      language,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Query('currency') currency?: string, @Query('language') language?: string) {
    const product = await this.products.findOne(id, currency, language);
    if (!product) {
      return { 
        message: 'Product not found or API quota exceeded. Please try again later.', 
        mock: true,
        id,
        title: 'Product not available',
        price_cny: 0,
        final_item_price: 0,
        converted_with_markup: 0,
        service_fee_amount: 0,
        images: [],
        rating: 0,
        sales: 0,
      };
    }
    return product;
  }

  @Get(':id/recommendations')
  async recommendations(@Param('id') id: string, @Query('currency') currency?: string, @Query('language') language?: string) {
    const recommendations = await this.products.getRecommendations(id, currency, language);
    return recommendations;
  }
}

