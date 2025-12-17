import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Req() req: any) {
    return this.orders.createFromCart(req.user.sub);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.orders.getStatus(id);
  }

  @Get()
  mine(@Req() req: any) {
    return this.orders.listUserOrders(req.user.sub);
  }
}

