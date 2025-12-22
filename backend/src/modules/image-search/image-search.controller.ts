import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ImageSearchService } from './image-search.service';

@Controller('image-search')
export class ImageSearchController {
  constructor(private readonly imageSearch: ImageSearchService) {}

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
  ) {
    const results = await this.imageSearch.searchByImage(imageId, picUrl);
    return {
      statusCode: 200,
      data: results,
    };
  }
}

