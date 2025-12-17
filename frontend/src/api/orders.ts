import { api } from '../lib/api';

export type OrderStatus = {
  id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { productId: string; title: string; qty: number; price: number }[];
};

export const createOrder = async () => {
  const res = await api.post<OrderStatus>('/order');
  return res.data;
};

export const fetchOrderStatus = async (id: string) => {
  const res = await api.get<OrderStatus>(`/order/${id}/status`);
  return res.data;
};

export const fetchOrderList = async () => {
  const res = await api.get<OrderStatus[]>('/order');
  return res.data;
};

