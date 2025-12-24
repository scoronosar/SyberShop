import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../state/settings';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { id: 'all', name: 'Все товары', icon: '🏪', query: '' },
  { id: 'electronics', name: 'Электроника', icon: '📱', query: '数码产品' },
  { id: 'fashion_women', name: 'Женская мода', icon: '👗', query: '时尚女装' },
  { id: 'fashion_men', name: 'Мужская мода', icon: '👔', query: '潮流男装' },
  { id: 'sports', name: 'Спорт', icon: '⚽', query: '运动户外' },
  { id: 'home', name: 'Дом', icon: '🏠', query: '家居用品' },
  { id: 'beauty', name: 'Красота', icon: '💄', query: '美妆护肤' },
  { id: 'accessories', name: 'Аксессуары', icon: '👜', query: '包包饰品' },
  { id: 'gifts', name: 'Подарки', icon: '🎁', query: '创意礼品' },
];

export const HomePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const priceMin = searchParams.get('price_min') ?? '';
  const priceMax = searchParams.get('price_max') ?? '';
  const availability = searchParams.get('availability') ?? '';
  const currency = useSettingsStore((s) => s.currency);
  const language = useSettingsStore((s) => s.language);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', q, sort, priceMin, priceMax, availability, currency, language, refreshKey],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts({
        query: q,
        sort,
        price_min: priceMin,
        price_max: priceMax,
        availability,
        currency,
        language,
        page: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has items (and is not too small), assume there might be more
      if (lastPage && lastPage.length >= 10) {
        return allPages.length + 1;
      }
      // Always allow at least 5 pages for recommendations
      if (allPages.length < 5 && !q) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const allProducts = data?.pages.flat() ?? [];

  const refreshRecommendations = () => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Invalidate product queries when currency or language changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
  }, [currency, language, queryClient]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      navigate(`?${next.toString()}`, { replace: true });
    },
    [searchParams, navigate],
  );

  const handleCategoryClick = (category: typeof CATEGORIES[0]) => {
    setSelectedCategory(category.id);
    const next = new URLSearchParams(searchParams);
    if (category.query) {
      next.set('q', category.query);
    } else {
      next.delete('q');
    }
    navigate(`?${next.toString()}`, { replace: true });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-amber-500 text-white shadow-2xl"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.25),transparent_25%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA3IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/25 backdrop-blur-md border border-white/40 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse shadow-lg shadow-green-400/50" />
                <span className="text-sm font-semibold tracking-wide">SyberShop × Taobao Global</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Миллионы товаров<br />
                <span className="bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
                  из Китая
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl opacity-95 leading-relaxed font-medium">
                Прямые закупки с Taobao. Выгодные цены с конвертацией валюты.<br />
                Доставка рассчитывается при прибытии груза на склад.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-2xl">🚀</span>
                  <span className="text-sm font-semibold">Быстрая обработка</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-sm font-semibold">Защита покупателя</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-2xl">💎</span>
                  <span className="text-sm font-semibold">Проверка качества</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {q && (
                <div className="px-6 py-3 rounded-xl bg-white/30 backdrop-blur-md border border-white/50 text-base font-bold shadow-xl">
                  🔍 Поиск: {q}
                </div>
              )}
              <div className="px-6 py-3 rounded-xl bg-white/30 backdrop-blur-md border border-white/50 text-base font-bold shadow-xl">
                💰 Валюта: {currency}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-10 -left-10 w-60 h-60 bg-amber-300/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl">🌏</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Глобальная доставка</h3>
              <p className="text-sm text-gray-600">Отправляем в любую точку мира через проверенные службы доставки</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Удобная оплата</h3>
              <p className="text-sm text-gray-600">Оплата товара сейчас, доставка - при прибытии груза</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Отслеживание груза</h3>
              <p className="text-sm text-gray-600">Полный трекинг от закупки до получения на складе</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Categories Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card p-8 bg-gradient-to-br from-white to-gray-50"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">🏷️</span>
            <span>Популярные категории</span>
        </h2>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-amber-100 border border-primary-200">
            <span className="text-sm font-semibold text-primary-700">
              {allProducts.length} товаров
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((category, idx) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => handleCategoryClick(category)}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-110 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-br from-primary-500 via-primary-400 to-amber-400 text-white border-primary-400 shadow-2xl ring-4 ring-primary-200'
                  : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-white hover:to-primary-50'
              }`}
            >
              {/* Icon with animation */}
              <div className={`text-3xl mb-2 transition-transform duration-300 ${
                selectedCategory === category.id ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {category.icon}
              </div>
              
              {/* Category name */}
              <div className={`text-xs font-bold leading-tight ${
                selectedCategory === category.id ? 'text-white' : 'text-gray-800 group-hover:text-primary-600'
              }`}>
                {category.name}
              </div>

              {/* Selected indicator */}
              {selectedCategory === category.id && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-primary-500 text-sm font-bold">✓</span>
                </div>
              )}

              {/* Hover glow effect */}
              {selectedCategory !== category.id && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 to-amber-500/0 group-hover:from-primary-500/5 group-hover:to-amber-500/5 transition-all duration-300" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Filters Section */}
      <motion.details 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card p-6 md:p-8 group bg-gradient-to-br from-white via-gray-50 to-white" 
        open
      >
        <summary className="text-lg font-extrabold cursor-pointer list-none flex items-center justify-between text-gray-900 hover:text-primary-600 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            </div>
            <span>Фильтры и сортировка</span>
          </div>
          <div className="flex items-center gap-2">
            {(sort || priceMin || priceMax || availability) && (
              <span className="px-3 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold border border-primary-200">
                Активны
              </span>
            )}
            <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform duration-300">▼</span>
          </div>
        </summary>
        
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span>Сортировка</span>
            </label>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field text-sm font-medium bg-white border-2 border-gray-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            >
              <option value="">🎯 По релевантности</option>
              <option value="price_asc">💰 Цена: сначала дешевле</option>
              <option value="price_desc">💎 Цена: сначала дороже</option>
              <option value="rating_desc">⭐ По рейтингу</option>
              <option value="sales_desc">🔥 По популярности</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-lg">💵</span>
              <span>Диапазон цен</span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
              <input
                  className="input-field text-sm font-medium bg-white border-2 border-gray-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                  placeholder="Мин."
                value={priceMin}
                onChange={(e) => updateParam('price_min', e.target.value)}
                inputMode="numeric"
              />
              </div>
              <div className="flex items-center text-gray-400 font-bold">—</div>
              <div className="flex-1">
              <input
                  className="input-field text-sm font-medium bg-white border-2 border-gray-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                  placeholder="Макс."
                value={priceMax}
                onChange={(e) => updateParam('price_max', e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span>Наличие товара</span>
            </label>
            <select
              value={availability}
              onChange={(e) => updateParam('availability', e.target.value)}
              className="input-field text-sm font-medium bg-white border-2 border-gray-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            >
              <option value="">Все товары</option>
              <option value="in_stock">✅ Только в наличии</option>
            </select>
          </div>
        </div>

        {/* Active filters indicator */}
        {(sort || priceMin || priceMax || availability) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">Активные фильтры:</span>
                <div className="flex flex-wrap gap-2">
                  {sort && <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold">Сортировка</span>}
                  {(priceMin || priceMax) && <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold">Цена</span>}
                  {availability && <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold">В наличии</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/', { replace: true });
                  setSelectedCategory('all');
                }}
                className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
              >
                <span>✕</span>
                <span>Сбросить все</span>
              </button>
            </div>
          </div>
        )}
      </motion.details>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-gray-600 font-semibold">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-amber-500 animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%, 40% 50%, 50% 60%, 60% 50%)' }} />
            <span>{t('common.loading')}</span>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
                className="h-72 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-100 via-gray-50 to-white animate-pulse shadow-md"
              >
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && allProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="text-sm font-semibold text-gray-700">
              {t('home.found')}: <span className="text-primary-600 text-lg">{allProducts.length}</span>
            </div>
            {!q && (
              <button
                onClick={refreshRecommendations}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <span className="text-lg">🔄</span>
                <span>{t('common.refresh')}</span>
              </button>
            )}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {allProducts.map((p, idx) => (
              <motion.div
                key={`${p.id}-${idx}`}
                initial={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 1) }}
                whileHover={{ scale: 1.03 }}
                className="transform-gpu"
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>

          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-3 text-gray-600 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-amber-500 animate-spin" 
                       style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%, 40% 50%, 50% 60%, 60% 50%)' }} />
                  <span>{t('common.loading_more')}</span>
                </div>
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span>📦</span>
                  <span>{t('common.show_more')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center card p-16 bg-gradient-to-br from-gray-50 to-white"
        >
          <div className="max-w-md mx-auto space-y-6">
            <div className="relative inline-block">
              <div className="text-8xl mb-4">🔍</div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                ✕
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-gray-900">{t('home.no_products')}</h3>
              <p className="text-base text-gray-600">
                {t('home.try_different')}
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <p className="text-sm font-semibold text-gray-700">Попробуйте:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    navigate('/', { replace: true });
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  🏠 Сбросить фильтры
                </button>
                <button
                  onClick={() => handleCategoryClick(CATEGORIES[1])}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold text-sm hover:border-primary-400 hover:shadow-md transition-all"
                >
                  📱 Электроника
                </button>
                <button
                  onClick={() => handleCategoryClick(CATEGORIES[2])}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold text-sm hover:border-primary-400 hover:shadow-md transition-all"
                >
                  👗 Женская мода
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

