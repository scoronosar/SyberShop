import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import { useEffect } from 'react';
import i18n from '../i18n';
import { useSettingsStore } from '../state/settings';
import { Modal } from './Modal';
import { ImageSearch } from './ImageSearch';

type Props = { children: ReactNode };

export const Layout = ({ children }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [showImageSearch, setShowImageSearch] = useState(false);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Header */}
      <header className="glass border-b-2 border-white/30 shadow-xl sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="container-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 py-4">
          {/* Logo */}
          <Link to="/" className="group text-2xl font-extrabold shrink-0 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-amber-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:shadow-primary-300/50 transition-all duration-300">
                <span className="text-white text-xl">🛍️</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-md animate-pulse" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-amber-500 bg-clip-text text-transparent">
                SyberShop
              </span>
              <span className="text-[10px] font-semibold text-gray-500 tracking-wider">TAOBAO GLOBAL</span>
            </div>
          </Link>
          
          {/* Enhanced Search Bar */}
          <form onSubmit={onSearch} className="w-full sm:flex-1 flex group">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти товары на Taobao..."
                className="w-full border-2 border-gray-200 pl-11 pr-24 py-3 focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all rounded-l-2xl font-medium text-sm placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowImageSearch(true)}
                className="absolute inset-y-0 right-0 px-4 flex items-center gap-2 hover:bg-primary-50 transition-all rounded-r-2xl group/img"
                title="Поиск по изображению"
              >
                <span className="text-xl group-hover/img:scale-110 transition-transform">📷</span>
                <span className="text-xs font-semibold text-gray-600 group-hover/img:text-primary-600 hidden sm:inline">
                  Фото
                </span>
              </button>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500 text-white px-8 hover:from-primary-600 hover:to-amber-600 hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold rounded-r-2xl shadow-lg"
            >
              Найти
            </button>
          </form>
          
          {/* Enhanced Navigation */}
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link 
              to="/cart" 
              className="px-4 py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-primary-50 hover:to-amber-50 hover:text-primary-600 transition-all flex items-center gap-2 border-2 border-transparent hover:border-primary-200 hover:shadow-md"
            >
              <span className="text-lg">🛒</span>
              <span>Корзина</span>
            </Link>
            
            {role === 'admin' && (
              <Link 
                to="/admin" 
                className="px-4 py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all flex items-center gap-2 border-2 border-transparent hover:border-purple-200 hover:shadow-md"
              >
                <span className="text-lg">⚙️</span>
                <span>Админ</span>
              </Link>
            )}
            
            <Link 
              to="/settings" 
              className="px-4 py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 transition-all flex items-center gap-2 border-2 border-transparent hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-lg">⚡</span>
              <span className="hidden sm:inline">Настройки</span>
            </Link>
            
            <Link 
              to="/account" 
              className="px-4 py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:text-green-600 transition-all flex items-center gap-2 border-2 border-transparent hover:border-green-200 hover:shadow-md"
            >
              <span className="text-lg">👤</span>
              <span className="hidden sm:inline">Аккаунт</span>
            </Link>
            
            {email ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 via-primary-50 to-amber-100 text-primary-700 font-bold border-2 border-primary-200 shadow-md">
                  {role ?? 'user'}
                </span>
                <button 
                  onClick={logout} 
                  className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 hover:shadow-md transition-all font-bold"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 transition-all font-bold shadow-lg"
              >
                Войти
              </Link>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container-xl py-8">{children}</main>
      
      {/* Enhanced Footer */}
      <footer className="border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 mt-auto">
        <div className="container-xl py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-amber-500 flex items-center justify-center shadow-xl">
                  <span className="text-white text-2xl">🛍️</span>
                </div>
                <div>
                  <div className="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    SyberShop
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">Taobao Global Platform</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ваш надежный партнер для покупок с Taobao. Миллионы товаров с быстрой доставкой.
              </p>
            </div>

            {/* Info Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <span>О платформе</span>
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>Конвертация CNY в локальную валюту</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>Сервисный сбор 3% включен в цену</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>Доставка при прибытии груза</span>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📞</span>
                <span>Поддержка</span>
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Время работы</div>
                  <div className="font-bold text-gray-900">24/7 Онлайн</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all hover:scale-105 shadow-md">
                    💬 Telegram
                  </button>
                  <button className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all hover:scale-105 shadow-md">
                    📧 Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 font-medium">
              © 2024 SyberShop. Powered by Taobao Global API
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold border border-green-200">
                🔒 Безопасные платежи
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-bold border border-blue-200">
                ⚡ Быстрая обработка
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Search Modal */}
      <Modal open={showImageSearch} onClose={() => setShowImageSearch(false)} title="">
        <ImageSearch onClose={() => setShowImageSearch(false)} />
      </Modal>
    </div>
  );
};

