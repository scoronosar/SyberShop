import { api } from '../lib/api';

export type Tracking = {
  orderId: string;
  status: string;
  delivery_fee: number;
  total: number;
  cargos: any[];
};

export const fetchTracking = async (orderId: string) => {
  const res = await api.get<Tracking>(`/logistics/order/${orderId}/tracking`);
  return res.data;
};

export const createCargo = async (orderIds: string[], shippingCost?: number) => {
  const res = await api.post('/logistics/cargo/create', { orderIds, shippingCost });
  return res.data as { cargoId: string; chinaOrderId: string; status: string };
};

export const arriveCargo = async (cargoId: string, shippingCost?: number) => {
  const res = await api.post(`/logistics/cargo/${cargoId}/arrive`, { shippingCost });
  return res.data;
};

