import { api } from '../lib/api';

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

export const addFavorite = async (productId: string, productData?: any) => {
  const response = await api.post('/favorites', { productId, productData });
  return response.data;
};

export const removeFavorite = async (productId: string) => {
  const response = await api.delete('/favorites', { data: { productId } });
  return response.data;
};

export const checkFavorite = async (productId: string) => {
  const response = await api.post('/favorites/check', { productId });
  return response.data;
};

