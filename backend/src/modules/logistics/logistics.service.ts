import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { ArriveCargoDto } from './dto/arrive-cargo.dto';

@Injectable()
export class LogisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCargo(dto: CreateCargoDto) {
    const orders = await this.prisma.order.findMany({ where: { id: { in: dto.orderIds } } });
    if (!orders.length) throw new BadRequestException('Orders not found');

    const chinaOrder = await this.prisma.chinaOrder.create({
      data: {
        status: 'created',
        totalYuan: 0,
        orders: {
          connect: orders.map((o) => ({ id: o.id })),
        },
      },
    });

    const cargo = await this.prisma.cargo.create({
      data: {
        chinaOrderId: chinaOrder.id,
        weight: dto.weight ?? null,
        volume: dto.volume ?? null,
        shippingCost: dto.shippingCost ?? null,
        status: 'created',
      },
    });

    await this.prisma.order.updateMany({
      where: { id: { in: dto.orderIds } },
      data: { status: 'in_transit', chinaOrderId: chinaOrder.id },
    });

    return { cargoId: cargo.id, chinaOrderId: chinaOrder.id, status: cargo.status };
  }

  async arrive(id: string, dto: ArriveCargoDto) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id }, include: { chinaOrder: { include: { orders: true } } } });
    if (!cargo) throw new NotFoundException('Cargo not found');

    const shippingCost = Number(dto.shippingCost ?? cargo.shippingCost ?? 0);
    const orders = cargo.chinaOrder.orders;
    if (!orders.length) throw new BadRequestException('No orders linked');
    const totalValue = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);

    for (const order of orders) {
      const shareRatio = totalValue ? Number(order.subtotal) / totalValue : 0;
      const deliveryFee = Number((shippingCost * shareRatio).toFixed(2));
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryFee,
          total: Number(order.subtotal) + deliveryFee,
          status: 'awaiting_delivery_payment',
        },
      });
    }

    await this.prisma.cargo.update({
      where: { id },
      data: {
        shippingCost,
        status: 'arrived',
        arrivalDate: new Date(),
      },
    });

    return this.trackingByCargo(id);
  }

  async tracking(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { chinaOrder: { include: { cargos: true } }, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      orderId: order.id,
      status: order.status,
      delivery_fee: Number(order.deliveryFee),
      total: Number(order.total),
      cargos: order.chinaOrder?.cargos ?? [],
    };
  }

  async trackingByCargo(cargoId: string) {
    const cargo = await this.prisma.cargo.findUnique({
      where: { id: cargoId },
      include: { chinaOrder: { include: { orders: true } } },
    });
    if (!cargo) throw new NotFoundException('Cargo not found');
    return {
      cargoId: cargo.id,
      status: cargo.status,
      arrivalDate: cargo.arrivalDate,
      shippingCost: cargo.shippingCost,
      orders: cargo.chinaOrder.orders.map((o) => o.id),
    };
  }
}

