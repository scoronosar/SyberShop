import { useSettingsStore } from '../state/settings';

export const SettingsPage = () => {
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">⚡</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Настройки</h1>
            <p className="text-sm text-gray-600">Персонализируйте ваш опыт</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <span>🌐</span>
              <span>Язык интерфейса</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
              className="input-field bg-white"
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <span>💰</span>
              <span>Валюта отображения</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'RUB' | 'USD')}
              className="input-field bg-white"
            >
              <option value="RUB">RUB (₽)</option>
              <option value="USD">USD ($)</option>
            </select>
            <div className="mt-3 text-xs text-gray-700 bg-white/60 p-3 rounded-lg">
              ℹ️ Меняет только отображение на фронте. Серверная цена в локальной валюте остаётся источником истины.
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">✓</span>
            <span>Все изменения сохраняются автоматически</span>
          </div>
        </div>
      </div>
    </div>
  );
};

