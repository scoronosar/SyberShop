import { Body, Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { OrdersService } from '../orders/orders.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('orders')
  async orders() {
    try {
      const orders = await this.prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      // Ensure purchased and purchasedAt fields exist (for backward compatibility)
      return orders.map(order => ({
        ...order,
        purchased: (order as any).purchased ?? false,
        purchasedAt: (order as any).purchasedAt ?? null,
      }));
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      // If schema doesn't have purchased field, return basic order data
      try {
        const orders = await this.prisma.order.findMany({
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        });
        return orders.map(order => ({
          ...order,
          purchased: false,
          purchasedAt: null,
        }));
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  @Get('analytics/logistics')
  async analytics() {
    const cargos = await this.prisma.cargo.findMany();
    return {
      cargos: cargos.length,
      arrived: cargos.filter((c) => c.status === 'arrived').length,
    };
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }

  @Patch('orders/:id/purchased')
  markOrderAsPurchased(@Param('id') id: string, @Body() body: { purchased: boolean }) {
    return body.purchased
      ? this.ordersService.markAsPurchased(id)
      : this.ordersService.unmarkAsPurchased(id);
  }

  @Post('create-admin')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.register({ ...dto, role: 'admin' } as any, true);
  }
}

