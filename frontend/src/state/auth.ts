import { create } from 'zustand';
import { api } from '../lib/api';

type AuthState = {
  token?: string;
  email?: string;
  role?: string;
  ready: boolean;
  setToken: (token?: string) => void;
  logout: () => void;
  loadSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: undefined,
  email: undefined,
  role: undefined,
  ready: false,
  setToken: (token) => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
    if (token) {
      localStorage.setItem('sybershop_token', token);
    } else {
      localStorage.removeItem('sybershop_token');
    }
    set({ token });
  },
  logout: () => {
    get().setToken(undefined);
    set({ email: undefined, role: undefined });
  },
  loadSession: async () => {
    const stored = localStorage.getItem('sybershop_token');
    if (stored) {
      get().setToken(stored);
      try {
        const res = await api.get('/auth/me');
        set({ email: res.data.email, role: res.data.role, ready: true });
        return;
      } catch {
        get().setToken(undefined);
      }
    }
    set({ ready: true });
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data.accessToken as string;
    get().setToken(token);
    const me = await api.get('/auth/me');
    set({ email: me.data.email, role: me.data.role, ready: true });
  },
  register: async (email, password, role) => {
    const res = await api.post('/auth/register', { email, password, role });
    const token = res.data.accessToken as string;
    get().setToken(token);
    const me = await api.get('/auth/me');
    set({ email: me.data.email, role: me.data.role, ready: true });
  },
}));

