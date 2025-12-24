import { create } from 'zustand';

export type SupportedCurrency = 'RUB' | 'USD' | 'UZS' | 'TJS' | 'KZT' | 'CNY';
export type SupportedLanguage = 'ru' | 'en' | 'tg' | 'kk' | 'uz' | 'fa' | 'ky';

type SettingsState = {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  setLanguage: (lang: SupportedLanguage) => void;
  setCurrency: (cur: SupportedCurrency) => void;
};

const storedLanguage = (typeof window !== 'undefined' && localStorage.getItem('sybershop_lang')) as
  | SupportedLanguage
  | null;
const storedCurrency = (typeof window !== 'undefined' && localStorage.getItem('sybershop_cur')) as
  | SupportedCurrency
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

