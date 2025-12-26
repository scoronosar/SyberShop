import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import { useEffect } from 'react';
import i18n from '../i18n';
import { useSettingsStore } from '../state/settings';
import { Modal } from './Modal';
import { ImageSearch } from './ImageSearch';
import { useTranslation } from 'react-i18next';

type Props = { children: ReactNode };

export const Layout = ({ children }: Props) => {
  const { t } = useTranslation();
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
      {/* Enhanced Header - Flexible & Modern */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b-2 border-gray-100 shadow-lg">
        <div className="container-xl px-2 sm:px-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3 lg:gap-4 py-2 sm:py-3 lg:py-4">
            {/* Logo Section - Always visible */}
            <Link 
              to="/" 
              className="group shrink-0 flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-amber-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-primary-300/50 transition-all duration-300">
                  <span className="text-white text-xl sm:text-2xl">🛍️</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-amber-500 bg-clip-text text-transparent">
              SyberShop
            </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 tracking-wider hidden sm:block">TAOBAO GLOBAL</span>
              </div>
          </Link>
          
            {/* Search Bar - Flexible width */}
            <form 
              onSubmit={onSearch} 
              className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 group"
            >
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('header.search_placeholder')}
                  className="w-full border-2 border-gray-200 pl-9 sm:pl-11 pr-16 sm:pr-20 md:pr-24 py-2 sm:py-2.5 lg:py-3 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all rounded-lg sm:rounded-xl md:rounded-l-2xl md:rounded-r-2xl font-medium text-xs sm:text-sm placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowImageSearch(true)}
                  className="absolute inset-y-0 right-0 px-2 sm:px-3 md:px-4 flex items-center gap-1 sm:gap-1.5 md:gap-2 hover:bg-primary-50 transition-all rounded-r-lg sm:rounded-r-xl md:rounded-r-2xl group/img"
                title={t('header.image_search')}
              >
                  <span className="text-base sm:text-lg md:text-xl group-hover/img:scale-110 transition-transform">📷</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-600 group-hover/img:text-primary-600 hidden sm:inline">
                    {t('header.photo')}
                  </span>
              </button>
            </div>
            <button
              type="submit"
                className="hidden sm:inline-flex bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 hover:from-primary-600 hover:to-amber-600 hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold rounded-lg sm:rounded-xl md:rounded-r-2xl md:rounded-l-none shadow-lg whitespace-nowrap items-center justify-center text-xs sm:text-sm md:text-base"
            >
              {t('common.search')}
            </button>
          </form>
          
            {/* Navigation - Responsive & Flexible */}
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold shrink-0">
              <Link 
                to="/cart" 
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-primary-50 hover:to-amber-50 hover:text-primary-600 transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-transparent hover:border-primary-200 hover:shadow-md"
              >
                <span className="text-base sm:text-lg">🛒</span>
                <span className="hidden sm:inline">{t('common.cart')}</span>
            </Link>
              
            {role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-transparent hover:border-purple-200 hover:shadow-md"
                >
                  <span className="text-base sm:text-lg">⚡</span>
                  <span className="hidden sm:inline">{t('common.admin')}</span>
                </Link>
              )}
              
              <Link 
                to="/settings" 
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:text-blue-600 transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-transparent hover:border-blue-200 hover:shadow-md"
              >
                <span className="text-base sm:text-lg">⚙️</span>
                <span className="hidden md:inline">{t('common.settings')}</span>
              </Link>
              
              <Link 
                to="/account" 
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:text-green-600 transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-transparent hover:border-green-200 hover:shadow-md"
              >
                <span className="text-base sm:text-lg">👤</span>
                <span className="hidden lg:inline">{t('common.account')}</span>
            </Link>
              
            {email ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 via-primary-50 to-amber-100 text-primary-700 font-bold border-2 border-primary-200 shadow-md text-xs sm:text-sm">
                  {role ?? 'user'}
                </span>
                  <button 
                    onClick={logout} 
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 hover:shadow-md transition-all font-bold text-xs sm:text-sm"
                  >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
                <Link 
                  to="/login" 
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 transition-all font-bold shadow-lg text-xs sm:text-sm whitespace-nowrap"
                >
                {t('common.login')}
              </Link>
            )}
          </nav>
          </div>
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
                {t('footer.description')}
              </p>
            </div>

            {/* Info Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <span>{t('footer.about')}</span>
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>{t('footer.feature_cny_conversion')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>{t('footer.feature_service_fee')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  <span>{t('footer.feature_delivery')}</span>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📞</span>
                <span>{t('footer.support')}</span>
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">{t('footer.working_hours')}</div>
                  <div className="font-bold text-gray-900">{t('footer.online_24_7')}</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all hover:scale-105 shadow-md">
                    💬 {t('footer.telegram')}
                  </button>
                  <button className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all hover:scale-105 shadow-md">
                    📧 {t('footer.email')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 font-medium">
              {t('footer.copyright')}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold border border-green-200">
                🔒 {t('footer.secure_payments')}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-bold border border-blue-200">
                ⚡ {t('footer.fast_processing')}
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

