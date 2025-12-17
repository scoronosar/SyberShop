import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useSettingsStore } from '../state/settings';
import { motion } from 'framer-motion';

export const HomePage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const priceMin = searchParams.get('price_min') ?? '';
  const priceMax = searchParams.get('price_max') ?? '';
  const availability = searchParams.get('availability') ?? '';
  const currency = useSettingsStore((s) => s.currency);
  const { data, isLoading } = useQuery({
    queryKey: ['products', q, sort, priceMin, priceMax, availability],
    queryFn: () =>
      fetchProducts({
        query: q,
        sort,
        price_min: priceMin,
        price_max: priceMax,
        availability,
        currency,
      }),
  });
  const { t } = useTranslation();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      window.history.replaceState(null, '', `?${next.toString()}`);
    },
    [searchParams],
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-400 to-amber-400 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.2),transparent_25%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-sm font-medium">SyberShop · Mock Marketplace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Чистый и быстрый<br />поиск товаров
              </h1>
              <p className="text-base sm:text-lg opacity-95 max-w-2xl leading-relaxed">
                Итоговые цены считаются на сервере с конвертацией и сервисным сбором. 
                Доставка добавится при прибытии карго.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <span className="px-4 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30 text-sm font-medium shadow-lg">
                {t('badges.mock')}
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30 text-sm font-medium shadow-lg">
                {t('badges.server')}
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30 text-sm font-medium shadow-lg">
                {t('badges.delivery')}
              </span>
              {q && (
                <span className="px-4 py-2 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-sm font-semibold shadow-lg">
                  🔍 Поиск: {q}
                </span>
              )}
              {currency && (
                <span className="px-4 py-2 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 text-sm font-semibold shadow-lg">
                  💰 {currency}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <details className="card p-6 md:p-8 group" open>
        <summary className="text-base font-bold cursor-pointer list-none flex items-center justify-between text-gray-800 hover:text-primary-600 transition-colors">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Фильтры и сортировка</span>
          </div>
          <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              📊 Сортировка
            </label>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field"
            >
              <option value="">По релевантности</option>
              <option value="price_asc">💰 Цена: дешевле</option>
              <option value="price_desc">💰 Цена: дороже</option>
              <option value="rating_desc">⭐ Рейтинг</option>
              <option value="sales_desc">🔥 Продажи</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              💵 Цена (мин-макс)
            </label>
            <div className="flex gap-2">
              <input
                className="input-field"
                placeholder="от"
                value={priceMin}
                onChange={(e) => updateParam('price_min', e.target.value)}
                inputMode="numeric"
              />
              <input
                className="input-field"
                placeholder="до"
                value={priceMax}
                onChange={(e) => updateParam('price_max', e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              📦 Доступность
            </label>
            <select
              value={availability}
              onChange={(e) => updateParam('availability', e.target.value)}
              className="input-field"
            >
              <option value="">Все товары</option>
              <option value="in_stock">✓ В наличии</option>
            </select>
          </div>
        </div>
      </details>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-100 via-gray-50 to-white animate-pulse shadow-sm"
            />
          ))}
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {data.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center card p-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Товары не найдены</h3>
          <p className="text-sm text-gray-600">
            Попробуйте изменить фильтры или запрос для поиска.
          </p>
        </div>
      )}
    </div>
  );
};

