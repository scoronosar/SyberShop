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
  ) {
    return this.products.search({
      query,
      sort,
      priceMin,
      priceMax,
      availability,
      currency,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Query('currency') currency?: string) {
    const product = await this.products.findOne(id, currency);
    return product ?? { message: 'Product not found', mock: true };
  }
}

