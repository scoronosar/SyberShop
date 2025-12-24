import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ImageSearchService } from './image-search.service';
import { ProductsService } from '../products/products.service';

@Controller('image-search')
export class ImageSearchController {
  constructor(
    private readonly imageSearch: ImageSearchService,
    private readonly productsService: ProductsService,
  ) {}

  @Post('upload')
  async uploadImage(@Body() body: { image_base64: string }) {
    const imageId = await this.imageSearch.uploadImage(body.image_base64);
    return {
      statusCode: 200,
      data: { image_id: imageId },
    };
  }

  @Get('search')
  async searchByImage(
    @Query('image_id') imageId?: string,
    @Query('pic_url') picUrl?: string,
    @Query('include_tags') includeTags?: string,
    @Query('language') language?: string,
    @Query('currency') currency?: string,
  ) {
    // Parse include_tags if provided (comma-separated or JSON array)
    let tagsArray: string[] | undefined;
    if (includeTags) {
      try {
        tagsArray = JSON.parse(includeTags);
      } catch {
        // If not JSON, treat as comma-separated
        tagsArray = includeTags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const rawResults = await this.imageSearch.searchByImage(imageId, picUrl, tagsArray, language);
    
    // Enrich products with currency conversion and pricing
    const enrichedResults = await Promise.all(
      rawResults.map((item) => this.productsService.enrichProduct(item, currency))
    );
    
    return {
      statusCode: 200,
      data: enrichedResults,
    };
  }
}

