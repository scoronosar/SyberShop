import { api } from '../lib/api';

export type CartItem = {
  id: string;
  productId: string;
  title: string;
  images: string[];
  qty: number;
  sku?: string;
  price: number;
  lineTotal: number;
};

export type Cart = {
  id?: string;
  items: CartItem[];
  subtotal: number;
};

export const getCart = async () => {
  const res = await api.get<Cart>('/cart');
  return res.data;
};

export const addToCart = async (productId: string, qty: number, currency?: string) => {
  const res = await api.post<Cart>('/cart', { productId, qty }, { params: { currency } });
  return res.data;
};

