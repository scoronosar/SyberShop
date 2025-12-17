import { create } from 'zustand';

type SettingsState = {
  language: 'ru' | 'en';
  currency: 'RUB' | 'USD';
  setLanguage: (lang: 'ru' | 'en') => void;
  setCurrency: (cur: 'RUB' | 'USD') => void;
};

const storedLanguage = (typeof window !== 'undefined' && localStorage.getItem('sybershop_lang')) as
  | 'ru'
  | 'en'
  | null;
const storedCurrency = (typeof window !== 'undefined' && localStorage.getItem('sybershop_cur')) as
  | 'RUB'
  | 'USD'
  | null;

export const useSettingsStore = create<SettingsState>((set) => ({
  language: storedLanguage ?? 'ru',
  currency: storedCurrency ?? 'RUB',
  setLanguage: (language) => {
    localStorage.setItem('sybershop_lang', language);
    set({ language });
  },
  setCurrency: (currency) => {
    localStorage.setItem('sybershop_cur', currency);
    set({ currency });
  },
}));

