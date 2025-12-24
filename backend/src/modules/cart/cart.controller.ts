import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: any) {
    return this.cart.getCart(req.user.sub);
  }

  @Post()
  add(@Req() req: any, @Body() dto: AddCartItemDto, @Query('currency') currency?: string) {
    return this.cart.addItem(req.user.sub, dto, currency);
  }

  @Delete(':itemId')
  remove(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cart.removeItem(req.user.sub, itemId);
  }
}

