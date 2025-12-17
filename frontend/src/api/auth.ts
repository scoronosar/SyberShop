import { api } from '../lib/api';

export const me = async () => {
  const res = await api.get('/auth/me');
  return res.data as { id: string; email: string; role: string };
};

export const createAdmin = async (email: string, password: string) => {
  const res = await api.post('/admin/create-admin', { email, password });
  return res.data as { accessToken: string };
};

