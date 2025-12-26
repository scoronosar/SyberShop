import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { UserActivityService } from '../user-activity/user-activity.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly userActivity: UserActivityService,
  ) {}

  async createFromCart(userId: string) {
    const cartData = await this.cart.getCart(userId);
    if (!cartData.items.length) throw new BadRequestException('Cart is empty');

    const subtotal = cartData.items.reduce((sum, i) => sum + i.lineTotal, 0 as number);
    const order = await this.prisma.order.create({
      data: {
        userId,
        subtotal: subtotal,
        total: subtotal,
        deliveryFee: 0,
        status: 'pending_processing',
      },
    });

    for (const item of cartData.items) {
      const prismaProduct = await this.prisma.product.findUniqueOrThrow({
        where: { externalId: item.productId },
      });
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: prismaProduct.id,
          qty: item.qty,
          sku: item.sku,
          finalPrice: item.price,
        },
      });

      // Record purchase activity
      this.userActivity.recordActivity({
        userId,
        activityType: 'purchase',
        productId: item.productId,
        metadata: { orderId: order.id, qty: item.qty, sku: item.sku },
      }).catch(() => {}); // Don't wait for activity recording
    }

    await this.cart.clearCart(userId);
    return this.getStatus(order.id);
  }

  async getStatus(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order.id,
      status: order.status,
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.deliveryFee),
      total: Number(order.total),
      items: order.items.map((i) => ({
        productId: i.product.externalId,
        title: i.product.titleOrig,
        qty: i.qty,
        price: Number(i.finalPrice),
      })),
    };
  }

  async listUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.deliveryFee),
      total: Number(order.total),
      created_at: order.createdAt,
      items: order.items.map((i) => ({
        productId: i.product.externalId,
        title: i.product.titleOrig,
        qty: i.qty,
        price: Number(i.finalPrice),
      })),
    }));
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async markAsPurchased(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    
    return this.prisma.order.update({
      where: { id },
      data: { 
        purchased: true,
        purchasedAt: new Date(),
        status: order.status === 'pending_processing' ? 'procured' : order.status,
      },
    });
  }

  async unmarkAsPurchased(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    
    return this.prisma.order.update({
      where: { id },
      data: { 
        purchased: false,
        purchasedAt: null,
      },
    });
  }
}

