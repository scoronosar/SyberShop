import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { UserActivityService } from '../user-activity/user-activity.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly userActivity: UserActivityService,
  ) {}

  @Get()
  async list(
    @Query('query') query?: string,
    @Query('sort') sort?: string,
    @Query('price_min') priceMin?: string,
    @Query('price_max') priceMax?: string,
    @Query('availability') availability?: string,
    @Query('currency') currency?: string,
    @Query('page') page?: string,
    @Query('language') language?: string,
    @Req() req?: any,
  ) {
    // Record search activity if user is authenticated
    const userId = req?.user?.sub;
    if (userId && query) {
      this.userActivity.recordActivity({
        userId,
        activityType: 'search',
        searchQuery: query,
        metadata: { sort, priceMin, priceMax, availability },
      }).catch(() => {}); // Don't wait for activity recording
    }

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
  async detail(
    @Param('id') id: string,
    @Query('currency') currency?: string,
    @Query('language') language?: string,
    @Req() req?: any,
  ) {
    // Record view activity if user is authenticated
    const userId = req?.user?.sub;
    if (userId) {
      this.userActivity.recordActivity({
        userId,
        activityType: 'view',
        productId: id,
        metadata: { currency, language },
      }).catch(() => {}); // Don't wait for activity recording
    }

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

