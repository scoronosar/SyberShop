import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserActivityService } from '../user-activity/user-activity.service';
import { TaobaoService } from '../taobao/taobao.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userActivity: UserActivityService,
    private readonly taobao: TaobaoService,
    private readonly products: ProductsService,
  ) {}

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit = 20,
    currency?: string,
    language?: string,
  ) {
    try {
      const preferences = await this.userActivity.getUserPreferences(userId);

      // If user has no activity, return empty
      if (
        preferences.viewedProducts.length === 0 &&
        preferences.searchKeywords.length === 0 &&
        preferences.purchasedProducts.length === 0
      ) {
        this.logger.log(`No preferences found for user ${userId}, returning empty recommendations`);
        return [];
      }

      // Strategy 1: Based on viewed products - find similar products
      const recommendations: any[] = [];
      const seenProductIds = new Set<string>();

      // Get recommendations based on viewed products (weight: high)
      if (preferences.viewedProducts.length > 0) {
        const viewedSample = preferences.viewedProducts.slice(0, 5); // Use top 5 viewed
        for (const productId of viewedSample) {
          try {
            const similar = await this.taobao.getRecommendedProducts(productId, language);
            for (const item of similar) {
              if (!seenProductIds.has(item.id)) {
                recommendations.push({ ...item, weight: 3, source: 'viewed' });
                seenProductIds.add(item.id);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to get recommendations for product ${productId}: ${error.message}`);
          }
        }
      }

      // Strategy 2: Based on search keywords (weight: medium-high)
      if (preferences.searchKeywords.length > 0 && recommendations.length < limit) {
        const topKeywords = preferences.searchKeywords.slice(0, 3);
        for (const keyword of topKeywords) {
          try {
            const searchResults = await this.taobao.searchProducts(keyword, 1, 10, language);
            for (const item of searchResults) {
              if (!seenProductIds.has(item.id)) {
                recommendations.push({ ...item, weight: 2, source: 'search' });
                seenProductIds.add(item.id);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to search for keyword "${keyword}": ${error.message}`);
          }
        }
      }

      // Strategy 3: Based on purchased products - find similar (weight: high)
      if (preferences.purchasedProducts.length > 0 && recommendations.length < limit) {
        const purchasedSample = preferences.purchasedProducts.slice(0, 3);
        for (const productId of purchasedSample) {
          try {
            const similar = await this.taobao.getRecommendedProducts(productId, language);
            for (const item of similar) {
              if (!seenProductIds.has(item.id)) {
                recommendations.push({ ...item, weight: 4, source: 'purchased' });
                seenProductIds.add(item.id);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to get recommendations for purchased product ${productId}: ${error.message}`);
          }
        }
      }

      // Strategy 4: Based on cart additions (weight: medium)
      if (preferences.cartedProducts.length > 0 && recommendations.length < limit) {
        const cartedSample = preferences.cartedProducts.slice(0, 3);
        for (const productId of cartedSample) {
          try {
            const similar = await this.taobao.getRecommendedProducts(productId, language);
            for (const item of similar) {
              if (!seenProductIds.has(item.id)) {
                recommendations.push({ ...item, weight: 2.5, source: 'carted' });
                seenProductIds.add(item.id);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to get recommendations for carted product ${productId}: ${error.message}`);
          }
        }
      }

      // Sort by weight (highest first) and limit
      const sorted = recommendations
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit)
        .map(({ weight, source, ...item }) => item); // Remove weight and source from final result

      // Enrich with pricing
      const enriched = await Promise.all(
        sorted.map((item) => this.products.enrichProduct(item, currency)),
      );

      this.logger.log(`Generated ${enriched.length} personalized recommendations for user ${userId}`);
      return enriched;
    } catch (error) {
      this.logger.error(`Failed to generate recommendations: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get trending recommendations (for users with no activity)
   */
  async getTrendingRecommendations(limit = 20, currency?: string, language?: string) {
    try {
      // Get mixed recommendations from Taobao search (no query = mixed recommendations)
      const recommendations = await this.taobao.searchProducts('', 1, limit, language);
      
      // Enrich with pricing
      const enriched = await Promise.all(
        recommendations.map((item) => this.products.enrichProduct(item, currency)),
      );

      return enriched;
    } catch (error) {
      this.logger.error(`Failed to get trending recommendations: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recommendations based on a specific product
   */
  async getProductBasedRecommendations(
    productId: string,
    limit = 10,
    currency?: string,
    language?: string,
  ) {
    try {
      const recommendations = await this.taobao.getRecommendedProducts(productId, language);
      const limited = recommendations.slice(0, limit);

      // Enrich with pricing
      const enriched = await Promise.all(
        limited.map((item) => this.products.enrichProduct(item, currency)),
      );

      return enriched;
    } catch (error) {
      this.logger.error(`Failed to get product-based recommendations: ${error.message}`);
      return [];
    }
  }
}

