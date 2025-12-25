import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettingsStore } from '../state/settings';
import { createCargo, arriveCargo } from '../api/logistics';
import { createAdmin } from '../api/auth';
import { getOAuthStatus, initiateOAuth, refreshOAuthToken } from '../api/oauth';
import { getAllCurrencyRates, updateCurrencyRate } from '../api/currency-rates';
import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';

export const AdminPage = () => {
  const { data, isLoading, isError: isOrdersError, error: ordersError } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      return res.data as any[];
    },
    retry: false,
  });

  const { data: oauthStatus, refetch: refetchOAuth } = useQuery({
    queryKey: ['oauth-status'],
    queryFn: async () => {
      const res = await getOAuthStatus();
      return res.data as { connected: boolean; account?: string; expiresAt?: string };
    },
  });

  const {
    data: currencyRates,
    isLoading: isLoadingCurrencyRates,
    isError: isCurrencyRatesError,
    error: currencyRatesError,
    refetch: refetchCurrencyRates,
  } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: getAllCurrencyRates,
    retry: 1,
  });

  const currency = useSettingsStore((s) => s.currency);
  const currencySymbols: Record<string, string> = {
    'RUB': '₽',
    'USD': '$',
    'UZS': 'сўм',
    'TJS': 'ЅМ',
    'KZT': '₸',
    'CNY': '¥',
  };
  const currencySymbol = currencySymbols[currency] || currency;
  const queryClient = useQueryClient();

  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ rate: string; markup: string }>({ rate: '', markup: '' });

  const [orderIdsInput, setOrderIdsInput] = useState('');
  const [cargoCost, setCargoCost] = useState<string>('');
  const [cargoId, setCargoId] = useState('');
  const [arriveCost, setArriveCost] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const createCargoMutation = useMutation({
    mutationFn: () =>
      createCargo(
        orderIdsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        cargoCost ? Number(cargoCost) : undefined,
      ),
    onSuccess: (res) => {
      toast.success(`Карго создано: ${res.cargoId}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error('Не удалось создать карго'),
  });

  const arriveMutation = useMutation({
    mutationFn: () => arriveCargo(cargoId, arriveCost ? Number(arriveCost) : undefined),
    onSuccess: () => {
      toast.success('Карго прибыло, доставка начислена');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error('Не удалось отметить прибытие'),
  });

  const createAdminMutation = useMutation({
    mutationFn: () => createAdmin(adminEmail, adminPassword),
    onSuccess: () => {
      toast.success('Админ создан');
      setAdminEmail('');
      setAdminPassword('');
    },
    onError: () => toast.error('Не удалось создать админа'),
  });

  const refreshTokenMutation = useMutation({
    mutationFn: refreshOAuthToken,
    onSuccess: () => {
      toast.success('Токен обновлён');
      refetchOAuth();
    },
    onError: () => toast.error('Не удалось обновить токен'),
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ currency: curr, data }: { currency: string; data: any }) =>
      updateCurrencyRate(curr, data),
    onSuccess: () => {
      toast.success('Курс валюты обновлён');
      refetchCurrencyRates();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      setEditingCurrency(null);
    },
    onError: () => toast.error('Не удалось обновить курс'),
  });

  const handleConnectTaoWorld = () => {
    initiateOAuth();
    // Listen for OAuth success message
    const checkInterval = setInterval(() => {
      refetchOAuth();
    }, 2000);
    
    setTimeout(() => {
      clearInterval(checkInterval);
      refetchOAuth();
    }, 60000); // Stop checking after 1 minute
  };

  const startEditCurrency = (curr: any) => {
    setEditingCurrency(curr.currency);
    setEditValues({
      rate: curr.rateFromCNY.toString(),
      markup: curr.markup.toString(),
    });
  };

  const saveEditCurrency = (curr: string) => {
    updateCurrencyMutation.mutate({
      currency: curr,
      data: {
        rateFromCNY: parseFloat(editValues.rate),
        markup: parseFloat(editValues.markup),
      },
    });
  };

  const toggleCurrencyActive = (curr: string, isActive: boolean) => {
    updateCurrencyMutation.mutate({
      currency: curr,
      data: { isActive: !isActive },
    });
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    createCargoMutation.mutate();
  };

  const submitArrive = (e: FormEvent) => {
    e.preventDefault();
    arriveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse" />
          <p className="text-gray-600 font-medium">Загружаем заказы...</p>
        </div>
      </div>
    );
  }

  if (isOrdersError) {
    const errorMessage = (ordersError as any)?.response?.status === 403
      ? 'Доступ запрещён. Убедитесь, что вы вошли как администратор.'
      : (ordersError as any)?.response?.data?.message || (ordersError as any)?.message || 'Не удалось загрузить заказы';
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки заказов</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            🔄 Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Админ панель</h1>
            <p className="text-sm text-gray-600">Управление заказами и логистикой</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          💾 Данные из бэкенда
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {!data || data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm">Заказы не найдены</p>
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <th className="text-left px-4 py-3 font-bold text-gray-700">ID заказа</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Статус</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Сумма</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Доставка</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Дата создания</th>
              </tr>
            </thead>
            <tbody>
                {data.map((order: any, idx: number) => (
                <tr key={order.id} className={`border-t hover:bg-primary-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-900 font-semibold">{order.id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold border border-primary-200">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {Number(order.subtotal).toFixed(2)} {currencySymbol}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {Number(order.deliveryFee).toFixed(2)} {currencySymbol}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h2 className="text-xl font-bold text-gray-900">Создать карго</h2>
          </div>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                🔢 ID заказов (через запятую)
              </label>
              <input
                value={orderIdsInput}
                onChange={(e) => setOrderIdsInput(e.target.value)}
                className="input-field"
                placeholder="order-id-1, order-id-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                💰 Стоимость карго (опционально)
              </label>
              <input
                value={cargoCost}
                onChange={(e) => setCargoCost(e.target.value)}
                className="input-field"
                placeholder="0"
                type="number"
                step="0.01"
              />
            </div>
            <button
              type="submit"
              disabled={createCargoMutation.isPending}
              className="btn-primary w-full"
            >
              {createCargoMutation.isPending ? '⏳ Создаём...' : '✓ Создать карго'}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <h2 className="text-xl font-bold text-gray-900">Отметить прибытие</h2>
          </div>
          <form className="space-y-4" onSubmit={submitArrive}>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                🏷️ ID карго
              </label>
              <input
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
                className="input-field"
                placeholder="cargo-id"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                💵 Фактическая стоимость (опционально)
              </label>
              <input
                value={arriveCost}
                onChange={(e) => setArriveCost(e.target.value)}
                className="input-field"
                placeholder="0"
                type="number"
                step="0.01"
              />
            </div>
            <button
              type="submit"
              disabled={arriveMutation.isPending}
              className="btn-primary w-full"
            >
              {arriveMutation.isPending ? '⏳ Обрабатываем...' : '✓ Отметить прибытие'}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-xl font-bold text-gray-900">Создать администратора</h2>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createAdminMutation.mutate();
            }}
          >
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                📧 Email
              </label>
              <input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="input-field"
                type="email"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                🔑 Пароль
              </label>
              <input
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field"
                type="password"
                placeholder="минимум 6 символов"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={createAdminMutation.isPending}
              className="btn-primary w-full"
            >
              {createAdminMutation.isPending ? '⏳ Создаём...' : '✓ Создать администратора'}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">💱</span>
            <h2 className="text-xl font-bold text-gray-900">Курсы валют</h2>
          </div>
          
          <p className="text-sm text-gray-600">
            Настройте курс конвертации из китайского юаня (CNY) в другие валюты и процент наценки.
          </p>

          {isLoadingCurrencyRates ? (
            <div className="text-center py-4 text-gray-500">
              <div className="text-3xl mb-2">💱</div>
              <p className="text-sm">Загрузка курсов валют...</p>
            </div>
          ) : isCurrencyRatesError ? (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="font-bold text-red-700 mb-1">Не удалось загрузить курсы валют</div>
              <div className="text-xs text-red-600 break-words">
                {(currencyRatesError as any)?.response?.status === 403
                  ? 'Доступ запрещён. Убедитесь, что вы вошли как администратор.'
                  : (currencyRatesError as any)?.response?.data?.message ||
                    (currencyRatesError as any)?.message ||
                    'Ошибка запроса'}
              </div>
              <button
                onClick={() => refetchCurrencyRates()}
                className="mt-3 btn-secondary w-full"
              >
                🔄 Повторить
              </button>
            </div>
          ) : currencyRates && currencyRates.length > 0 ? (
            <div className="space-y-3">
              {currencyRates.map((rate) => (
                <div
                  key={rate.currency}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    rate.isActive
                      ? 'bg-white border-green-200'
                      : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{rate.symbol}</span>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {rate.name}
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {rate.code}
                          </span>
                        </div>
                        {editingCurrency === rate.currency ? (
                          <div className="flex gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600">Курс:</span>
                              <input
                                type="number"
                                step="0.0001"
                                value={editValues.rate}
                                onChange={(e) =>
                                  setEditValues({ ...editValues, rate: e.target.value })
                                }
                                className="input-field w-24 text-sm py-1"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600">Наценка:</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.markup}
                                onChange={(e) =>
                                  setEditValues({ ...editValues, markup: e.target.value })
                                }
                                className="input-field w-20 text-sm py-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-1">
                            1 CNY (¥) = {rate.rateFromCNY} {rate.symbol} × {rate.markup} (наценка)
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingCurrency === rate.currency ? (
                        <>
                          <button
                            onClick={() => saveEditCurrency(rate.currency)}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600"
                          >
                            ✓ Сохранить
                          </button>
                          <button
                            onClick={() => setEditingCurrency(null)}
                            className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-lg hover:bg-gray-500"
                          >
                            ✕ Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCurrency(rate)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                          >
                            ✎ Изменить
                          </button>
                          <button
                            onClick={() => toggleCurrencyActive(rate.currency, rate.isActive)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg ${
                              rate.isActive
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {rate.isActive ? '⏸ Отключить' : '▶ Включить'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-3xl mb-2">💱</div>
              <p className="text-sm">Курсы валют не найдены</p>
              <button
                onClick={() => refetchCurrencyRates()}
                className="mt-3 btn-secondary w-full"
              >
                🔄 Обновить
              </button>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <h2 className="text-xl font-bold text-gray-900">TaoWorld API</h2>
          </div>
          
          {oauthStatus?.connected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="font-bold text-green-800">Подключено</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Аккаунт:</span> {oauthStatus.account || 'Unknown'}
                </p>
                {oauthStatus.expiresAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Токен действителен до: {new Date(oauthStatus.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => refetchOAuth()}
                  className="btn-secondary flex-1"
                >
                  🔄 Обновить статус
                </button>
              <button
                onClick={() => refreshTokenMutation.mutate()}
                disabled={refreshTokenMutation.isPending}
                  className="btn-secondary flex-1"
              >
                {refreshTokenMutation.isPending ? '⏳ Обновляем...' : '🔄 Обновить токен'}
              </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <span className="font-bold text-yellow-800">Не подключено</span>
                </div>
                <p className="text-sm text-gray-700">
                  Подключите TaoWorld аккаунт для получения реальных данных товаров из Taobao API.
                </p>
              </div>
              <button
                onClick={handleConnectTaoWorld}
                className="btn-primary w-full"
              >
                🔗 Подключить TaoWorld
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

