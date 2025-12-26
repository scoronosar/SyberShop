import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { ProductsService } from '../products/products.service';
import { UserActivityService } from '../user-activity/user-activity.service';
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
    private readonly userActivity: UserActivityService,
  ) {}

  private safeParseSku(sku?: string | null): any | null {
    if (!sku) return null;
    try {
      const parsed = JSON.parse(sku);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

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
      images: (() => {
        const sku = this.safeParseSku(item.sku);
        const picUrl = sku?.pic_url || sku?.picUrl;
        if (picUrl) return [picUrl, ...item.product.images];
        return item.product.images;
      })(),
      qty: item.qty,
      sku: item.sku,
      price: Number(item.snapshot?.finalPrice ?? 0),
      lineTotal: Number(item.snapshot?.finalPrice ?? 0) * item.qty,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0 as number);
    return { id: cart.id, items, subtotal: Number(subtotal.toFixed(2)) };
  }

  async addItem(userId: string, dto: AddCartItemDto, currency?: string) {
    const product = await this.products.findOne(dto.productId, currency);
    if (!product) throw new NotFoundException('Product not found');

    // If SKU was selected, try to price by that SKU (Taobao sku_list price fields are in "fen")
    let priceCnyForPricing = product.price_cny;
    const skuPayload = this.safeParseSku(dto.sku);
    const mpSkuId = skuPayload?.mp_sku_id?.toString?.() ?? skuPayload?.mp_sku_id ?? null;
    const skuId = skuPayload?.sku_id?.toString?.() ?? skuPayload?.sku_id ?? null;

    if (skuPayload && Array.isArray((product as any).sku_list) && ((mpSkuId && mpSkuId !== 'undefined') || (skuId && skuId !== 'undefined'))) {
      const skuList = (product as any).sku_list as any[];
      const found = skuList.find((s) => {
        const sMp = (s?.mp_sku_id ?? s?.mp_skuId ?? s?.mp_skuID ?? '').toString();
        const sSku = (s?.sku_id ?? '').toString();
        return (mpSkuId && sMp && sMp === mpSkuId) || (skuId && sSku && sSku === skuId);
      });

      if (found) {
        const fen =
          Number.parseInt(found?.coupon_price ?? found?.couponPrice ?? found?.promotion_price ?? found?.promotionPrice ?? found?.price ?? '0', 10) || 0;
        if (fen > 0) priceCnyForPricing = fen / 100;
      }
    }

    const pricing = await this.currency.applyPricing(Number(priceCnyForPricing), currency);
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

    // Record add to cart activity
    this.userActivity.recordActivity({
      userId,
      activityType: 'add_to_cart',
      productId: dto.productId,
      metadata: { sku: dto.sku, qty: dto.qty },
    }).catch(() => {}); // Don't wait for activity recording

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
  }
}

