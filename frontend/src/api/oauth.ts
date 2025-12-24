import { api } from '../lib/api';

const API_URL = '/api/oauth';

export const getOAuthStatus = async () => {
  const response = await api.get(`${API_URL}/status`);
  return response.data;
};

export const initiateOAuth = () => {
  // Open OAuth authorization in new window
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  
  window.open(
    `${API_URL}/authorize`,
    'TaoWorld OAuth',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};

export const refreshOAuthToken = async () => {
  const response = await api.get(`${API_URL}/refresh`);
  return response.data;
};

