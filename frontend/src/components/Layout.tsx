import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import { useEffect } from 'react';
import i18n from '../i18n';
import { useSettingsStore } from '../state/settings';

type Props = { children: ReactNode };

export const Layout = ({ children }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const language = useSettingsStore((s) => s.language);
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="container-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 py-4">
          <Link to="/" className="group text-2xl font-extrabold shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300">
              <span className="text-white text-sm">🛍️</span>
            </div>
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              SyberShop
            </span>
          </Link>
          
          <form onSubmit={onSearch} className="w-full sm:flex-1 flex group">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по Taobao товарам..."
                className="w-full rounded-l-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 rounded-r-xl hover:from-primary-600 hover:to-primary-700 hover:shadow-glow transition-all duration-200 font-medium"
            >
              Найти
            </button>
          </form>
          
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link to="/cart" className="px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center gap-1.5">
              <span>🛒</span>
              <span>Корзина</span>
            </Link>
            {role === 'admin' && (
              <Link to="/admin" className="px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Админ</span>
              </Link>
            )}
            <Link to="/settings" className="px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center gap-1.5">
              <span>⚡</span>
              <span>Настройки</span>
            </Link>
            <Link to="/account" className="px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center gap-1.5">
              <span>👤</span>
              <span>Аккаунт</span>
            </Link>
            {email ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-100 to-amber-100 text-primary-700 font-semibold border border-primary-200 shadow-sm">
                  {role ?? 'user'}
                </span>
                <button onClick={logout} className="px-3 py-2 rounded-lg text-primary-600 hover:bg-red-50 hover:text-red-600 transition-all font-medium">
                  Выйти
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md transition-all font-medium">
                Войти
              </Link>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container-xl py-8">{children}</main>
      
      <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
        <div className="container-xl py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                <span className="text-white text-lg">🛍️</span>
              </div>
              <div>
                <div className="font-bold text-gray-800">SyberShop</div>
                <div className="text-xs text-gray-500">Mock Marketplace</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 max-w-md">
              Конвертация CNY → локальная валюта с наценкой. Доставка добавляется при прибытии карго.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

