import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, productId: string, productData?: any) {
    return this.prisma.favorite.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      create: {
        userId,
        productId,
        productData,
      },
      update: {
        productData,
      },
    });
  }

  async remove(userId: string, productId: string) {
    return this.prisma.favorite.deleteMany({
      where: { userId, productId },
    });
  }

  async getAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.favorite.count({
      where: { userId, productId },
    });
    return count > 0;
  }
}

