import { Controller, Get, Query, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('personalized')
  async getPersonalized(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('currency') currency?: string,
    @Query('language') language?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      return [];
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.recommendations.getPersonalizedRecommendations(
      userId,
      limitNum,
      currency,
      language,
    );
  }

  @Get('trending')
  async getTrending(
    @Query('limit') limit?: string,
    @Query('currency') currency?: string,
    @Query('language') language?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.recommendations.getTrendingRecommendations(limitNum, currency, language);
  }

  @Get('product/:productId')
  async getProductBased(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
    @Query('currency') currency?: string,
    @Query('language') language?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendations.getProductBasedRecommendations(
      productId,
      limitNum,
      currency,
      language,
    );
  }
}

