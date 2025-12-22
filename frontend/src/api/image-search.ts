import { api } from '../lib/api';

export const uploadImageSearch = async (base64Image: string) => {
  const response = await api.post('/image-search/upload', { image_base64: base64Image });
  return response.data;
};

export const searchByImage = async (imageId?: string, picUrl?: string) => {
  const response = await api.get('/image-search/search', { params: { image_id: imageId, pic_url: picUrl } });
  return response.data;
};

