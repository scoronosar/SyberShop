import { api } from '../lib/api';

export type CurrencyRate = {
  id: string;
  currency: string;
  code: string;
  name: string;
  symbol: string;
  rateFromCNY: number;
  markup: number;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
};

export const getAllCurrencyRates = async (): Promise<CurrencyRate[]> => {
  const response = await api.get('/currency-rates/all');
  return response.data;
};

export const updateCurrencyRate = async (
  currency: string,
  data: {
    rateFromCNY?: number;
    markup?: number;
    isActive?: boolean;
    name?: string;
    symbol?: string;
  },
): Promise<CurrencyRate> => {
  const response = await api.put(`/currency-rates/${currency}`, data);
  return response.data;
};

export const getActiveCurrencies = async (): Promise<CurrencyRate[]> => {
  const response = await api.get('/currency-rates');
  return response.data;
};

