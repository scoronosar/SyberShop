import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ActivityType = 'view' | 'search' | 'add_to_cart' | 'purchase' | 'click';

export interface CreateActivityDto {
  userId?: string;
  activityType: ActivityType;
  productId?: string;
  searchQuery?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record user activity (view, search, add to cart, etc.)
   */
  async recordActivity(dto: CreateActivityDto): Promise<void> {
    try {
      // Don't record activities for anonymous users (unless we want to track by session)
      if (!dto.userId) {
        return;
      }

      await this.prisma.userActivity.create({
        data: {
          userId: dto.userId,
          activityType: dto.activityType,
          productId: dto.productId,
          searchQuery: dto.searchQuery,
          metadata: dto.metadata || {},
        },
      });

      this.logger.debug(`Recorded activity: ${dto.activityType} for user ${dto.userId}`);
    } catch (error) {
      // Don't fail the main request if activity recording fails
      this.logger.warn(`Failed to record activity: ${error.message}`);
    }
  }

  /**
   * Get user's recent activities
   */
  async getUserActivities(userId: string, limit = 50) {
    return this.prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user's viewed products
   */
  async getViewedProducts(userId: string, limit = 20): Promise<string[]> {
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        activityType: 'view',
        productId: { not: null },
      },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['productId'],
    });

    return activities.map((a) => a.productId!).filter(Boolean);
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: string, limit = 20): Promise<string[]> {
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        activityType: 'search',
        searchQuery: { not: null },
      },
      select: { searchQuery: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['searchQuery'],
    });

    return activities.map((a) => a.searchQuery!).filter(Boolean);
  }

  /**
   * Get user's purchased products
   */
  async getPurchasedProducts(userId: string): Promise<string[]> {
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        activityType: 'purchase',
        productId: { not: null },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    return activities.map((a) => a.productId!).filter(Boolean);
  }

  /**
   * Get user's cart additions
   */
  async getCartAdditions(userId: string, limit = 30): Promise<string[]> {
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        activityType: 'add_to_cart',
        productId: { not: null },
      },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['productId'],
    });

    return activities.map((a) => a.productId!).filter(Boolean);
  }

  /**
   * Get user preferences based on activities
   */
  async getUserPreferences(userId: string) {
    const [viewed, searched, purchased, carted] = await Promise.all([
      this.getViewedProducts(userId, 50),
      this.getSearchHistory(userId, 30),
      this.getPurchasedProducts(userId),
      this.getCartAdditions(userId, 30),
    ]);

    // Extract keywords from search queries
    const searchKeywords = searched
      .flatMap((q) => q.toLowerCase().split(/\s+/))
      .filter((w) => w.length > 2);

    // Count keyword frequency
    const keywordCounts: Record<string, number> = {};
    searchKeywords.forEach((keyword) => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    // Get most common keywords
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    return {
      viewedProducts: viewed,
      searchKeywords: topKeywords,
      purchasedProducts: purchased,
      cartedProducts: carted,
      interests: topKeywords, // Main interests based on searches
    };
  }
}

