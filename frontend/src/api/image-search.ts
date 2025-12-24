import { api } from '../lib/api';

export const uploadImageSearch = async (base64Image: string) => {
  const response = await api.post('/image-search/upload', { image_base64: base64Image });
  return response.data;
};

export const searchByImage = async (
  imageId?: string,
  picUrl?: string,
  includeTags?: string[],
  language?: string,
  currency?: string,
) => {
  const params: Record<string, any> = {};
  if (imageId) params.image_id = imageId;
  if (picUrl) params.pic_url = picUrl;
  if (includeTags && includeTags.length > 0) {
    params.include_tags = JSON.stringify(includeTags);
  }
  if (language) params.language = language;
  if (currency) params.currency = currency;
  
  const response = await api.get('/image-search/search', { params });
  return response.data;
};

