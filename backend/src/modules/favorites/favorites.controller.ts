import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  async getAll(@Req() req: any) {
    return this.favorites.getAll(req.user.sub);
  }

  @Post()
  async add(@Req() req: any, @Body() body: { productId: string; productData?: any }) {
    return this.favorites.add(req.user.sub, body.productId, body.productData);
  }

  @Delete()
  async remove(@Req() req: any, @Body() body: { productId: string }) {
    return this.favorites.remove(req.user.sub, body.productId);
  }

  @Post('check')
  async check(@Req() req: any, @Body() body: { productId: string }) {
    const isFav = await this.favorites.isFavorite(req.user.sub, body.productId);
    return { isFavorite: isFav };
  }
}

