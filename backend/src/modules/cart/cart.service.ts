import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { ProductsService } from '../products/products.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

type CartLine = {
  id: string;
  productId: string;
  title: string;
  images: string[];
  qty: number;
  sku: string | null;
  price: number;
  lineTotal: number;
};

type CartSummary = {
  id?: string;
  items: CartLine[];
  subtotal: number;
};

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currency: CurrencyService,
    private readonly products: ProductsService,
  ) {}

  async getCart(userId: string): Promise<CartSummary> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: { product: true, snapshot: true },
        },
      },
    });
    if (!cart) return { items: [], subtotal: 0 };
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.product.externalId,
      title: item.product.titleOrig,
      images: item.product.images,
      qty: item.qty,
      sku: item.sku,
      price: Number(item.snapshot?.finalPrice ?? 0),
      lineTotal: Number(item.snapshot?.finalPrice ?? 0) * item.qty,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0 as number);
    return { id: cart.id, items, subtotal: Number(subtotal.toFixed(2)) };
  }

  async addItem(userId: string, dto: AddCartItemDto, currency?: string) {
    const product = await this.products.findOne(dto.productId);
    if (!product) throw new NotFoundException('Product not found');

    const pricing = await this.currency.applyPricing(product.price_cny, currency);
    const productRecord = await this.prisma.product.findUniqueOrThrow({
      where: { externalId: dto.productId },
    });
    const snapshot = await this.prisma.productPriceSnapshot.create({
      data: {
        product: { connect: { id: productRecord.id } },
        rateUsed: pricing.rate,
        convertedPrice: pricing.converted,
        finalPrice: pricing.final_per_item,
        serviceFee: pricing.service_fee_percent,
      },
    });

    const existingCart =
      (await this.prisma.cart.findFirst({ where: { userId } })) ??
      (await this.prisma.cart.create({ data: { userId } }));

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId_sku: {
          cartId: existingCart.id,
          productId: productRecord.id,
          sku: dto.sku ?? '',
        },
      },
      update: {
        qty: { increment: dto.qty },
        snapshotId: snapshot.id,
      },
      create: {
        cartId: existingCart.id,
        productId: productRecord.id,
        qty: dto.qty,
        sku: dto.sku ?? '',
        snapshotId: snapshot.id,
      },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
  }
}

