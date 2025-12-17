import { api } from '../lib/api';

export type Product = {
  id: string;
  title: string;
  price_cny: number;
  final_item_price: number;
  converted_with_markup: number;
  service_fee_amount: number;
  images: string[];
  mock: boolean;
  rating?: number;
  sales?: number;
};

type ProductQuery = {
  query?: string;
  sort?: string;
  price_min?: string;
  price_max?: string;
  availability?: string;
  currency?: string;
};

export const fetchProducts = async (params?: ProductQuery) => {
  const res = await api.get<Product[]>('/products', { params });
  return res.data;
};

export const fetchProduct = async (id: string, currency?: string) => {
  const res = await api.get<Product>(`/products/${id}`, { params: { currency } });
  return res.data;
};

