import { useSettingsStore, type SupportedCurrency } from '../state/settings';
import { useQuery } from '@tanstack/react-query';
import { getActiveCurrencies } from '../api/currency-rates';
import { useTranslation } from 'react-i18next';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const { data: availableCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: getActiveCurrencies,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">⚡</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{t('settings.title')}</h1>
            <p className="text-sm text-gray-600">{t('settings.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <span>🌐</span>
              <span>{t('settings.language')}</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="input-field bg-white"
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇬🇧 English</option>
              <option value="tg">🇹🇯 Тоҷикӣ</option>
              <option value="kk">🇰🇿 Қазақша</option>
              <option value="uz">🇺🇿 O‘zbekcha</option>
              <option value="fa">🇦🇫 فارسی</option>
              <option value="ky">🇰🇬 Кыргызча</option>
            </select>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <span>💰</span>
              <span>{t('settings.currency')}</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="input-field bg-white"
            >
              {availableCurrencies && availableCurrencies.length > 0 ? (
                availableCurrencies.map((curr) => (
                  <option key={curr.currency} value={curr.currency}>
                    {curr.code} ({curr.symbol}) - {curr.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="RUB">RUB (₽) - Российский рубль</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="UZS">UZS (сўм) - Узбекский сум</option>
                  <option value="TJS">TJS (ЅМ) - Таджикский сомони</option>
                  <option value="KZT">KZT (₸) - Казахстанский тенге</option>
                  <option value="CNY">CNY (¥) - Китайский юань</option>
                </>
              )}
            </select>
            <div className="mt-3 text-xs text-gray-700 bg-white/60 p-3 rounded-lg">
              ℹ️ {t('settings.currency_note')}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">✓</span>
            <span>{t('settings.auto_save')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

