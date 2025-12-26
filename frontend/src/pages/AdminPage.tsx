import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettingsStore } from '../state/settings';
import { createCargo, arriveCargo } from '../api/logistics';
import { createAdmin } from '../api/auth';
import { getOAuthStatus, initiateOAuth, refreshOAuthToken } from '../api/oauth';
import { getAllCurrencyRates, updateCurrencyRate } from '../api/currency-rates';
import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const AdminPage = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purchasedFilter, setPurchasedFilter] = useState<string>('all');
  
  const { data, isLoading, isError: isOrdersError, error: ordersError } = useQuery({
    queryKey: ['admin-orders', statusFilter, purchasedFilter],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      let orders = res.data as any[];
      
      // Apply status filter
      if (statusFilter !== 'all') {
        orders = orders.filter((o) => o.status === statusFilter);
      }
      
      // Apply purchased filter
      if (purchasedFilter === 'purchased') {
        orders = orders.filter((o) => o.purchased === true);
      } else if (purchasedFilter === 'not_purchased') {
        orders = orders.filter((o) => !o.purchased);
      }
      
      return orders;
    },
    retry: false,
  });

  // Calculate analytics from orders data
  const analytics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrder: 0,
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        revenueToday: 0,
        revenueWeek: 0,
        revenueMonth: 0,
        ordersByStatus: {} as Record<string, number>,
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalOrders = data.length;
    const totalRevenue = data.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pendingOrders = data.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = data.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const todayOrders = data.filter((o) => new Date(o.createdAt) >= today).length;
    const weekOrders = data.filter((o) => new Date(o.createdAt) >= weekAgo).length;
    const monthOrders = data.filter((o) => new Date(o.createdAt) >= monthAgo).length;

    const revenueToday = data
      .filter((o) => new Date(o.createdAt) >= today)
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const revenueWeek = data
      .filter((o) => new Date(o.createdAt) >= weekAgo)
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const revenueMonth = data
      .filter((o) => new Date(o.createdAt) >= monthAgo)
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const ordersByStatus: Record<string, number> = {};
    data.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      averageOrder,
      todayOrders,
      weekOrders,
      monthOrders,
      revenueToday,
      revenueWeek,
      revenueMonth,
      ordersByStatus,
    };
  }, [data]);

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
      toast.success(`${t('admin.cargo_created')}: ${res.cargoId}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error(t('admin.cargo_failed')),
  });

  const arriveMutation = useMutation({
    mutationFn: () => arriveCargo(cargoId, arriveCost ? Number(arriveCost) : undefined),
    onSuccess: () => {
      toast.success(t('admin.arrival_marked'));
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error(t('admin.arrival_failed')),
  });

  const createAdminMutation = useMutation({
    mutationFn: () => createAdmin(adminEmail, adminPassword),
    onSuccess: () => {
      toast.success(t('admin.admin_created'));
      setAdminEmail('');
      setAdminPassword('');
    },
    onError: () => toast.error(t('admin.admin_failed')),
  });

  const refreshTokenMutation = useMutation({
    mutationFn: refreshOAuthToken,
    onSuccess: () => {
      toast.success(t('admin.token_refreshed'));
      refetchOAuth();
    },
    onError: () => toast.error(t('admin.token_failed')),
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ currency: curr, data }: { currency: string; data: any }) =>
      updateCurrencyRate(curr, data),
    onSuccess: () => {
      toast.success(t('admin.rate_updated'));
      refetchCurrencyRates();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      setEditingCurrency(null);
    },
    onError: () => toast.error(t('admin.rate_failed')),
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
          <p className="text-gray-600 font-medium">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (isOrdersError) {
    const errorMessage = (ordersError as any)?.response?.status === 403
      ? t('admin.access_denied')
      : (ordersError as any)?.response?.data?.message || (ordersError as any)?.message || t('admin.error');
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.error')}</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            🔄 {t('admin.refresh')}
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
            <h1 className="text-3xl font-extrabold text-gray-900">{t('admin.title')}</h1>
            <p className="text-sm text-gray-600">{t('admin.subtitle')}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          💾 {t('admin.backend_data')}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.total_orders')}</div>
          <div className="text-3xl font-extrabold text-gray-900">{analytics.totalOrders}</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.total_revenue')}</div>
          <div className="text-3xl font-extrabold text-gray-900">
            {analytics.totalRevenue.toFixed(2)} {currencySymbol}
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.pending_orders')}</div>
          <div className="text-3xl font-extrabold text-gray-900">{analytics.pendingOrders}</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.completed_orders')}</div>
          <div className="text-3xl font-extrabold text-gray-900">{analytics.completedOrders}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.average_order')}</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {analytics.averageOrder.toFixed(2)} {currencySymbol}
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.revenue_today')}</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {analytics.revenueToday.toFixed(2)} {currencySymbol}
          </div>
          <div className="text-xs text-gray-500 mt-1">{analytics.todayOrders} {t('admin.today_orders')}</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <div className="text-sm text-gray-600 mb-1">{t('admin.revenue_month')}</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {analytics.revenueMonth.toFixed(2)} {currencySymbol}
          </div>
          <div className="text-xs text-gray-500 mt-1">{analytics.monthOrders} {t('admin.this_month')}</div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.orders_by_status')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
            <div key={status} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">{status}</div>
              <div className="text-2xl font-extrabold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📊 {t('admin.filter_status', 'Фильтр по статусу')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">{t('admin.all_statuses', 'Все статусы')}</option>
              <option value="pending_processing">{t('admin.status_pending', 'В обработке')}</option>
              <option value="procured">{t('admin.status_procured', 'Закуплено')}</option>
              <option value="purchased">{t('admin.status_purchased', 'Куплено')}</option>
              <option value="completed">{t('admin.status_completed', 'Завершено')}</option>
              <option value="delivered">{t('admin.status_delivered', 'Доставлено')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🛒 {t('admin.filter_purchased', 'Фильтр по покупке')}
            </label>
            <select
              value={purchasedFilter}
              onChange={(e) => setPurchasedFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">{t('admin.all', 'Все')}</option>
              <option value="purchased">{t('admin.purchased_only', 'Только купленные')}</option>
              <option value="not_purchased">{t('admin.not_purchased', 'Не купленные')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPurchasedFilter('all');
              }}
              className="btn-secondary w-full"
            >
              🔄 {t('admin.reset_filters', 'Сбросить фильтры')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {!data || data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm">{t('admin.no_orders')}</p>
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.order_id')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.status')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.amount')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.delivery')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.purchased', 'Куплено')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.created_at')}</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">{t('admin.actions', 'Действия')}</th>
              </tr>
            </thead>
            <tbody>
                {data.map((order: any, idx: number) => (
                <tr key={order.id} className={`border-t hover:bg-primary-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-900 font-semibold">{order.id}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        api.patch(`/admin/orders/${order.id}/status`, { status: e.target.value })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                            toast.success(t('admin.status_updated', 'Статус обновлён'));
                          })
                          .catch(() => toast.error(t('admin.status_update_failed', 'Не удалось обновить статус')));
                      }}
                      className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold border border-primary-200 hover:bg-primary-200 transition-colors"
                    >
                      <option value="pending_processing">{t('admin.status_pending', 'В обработке')}</option>
                      <option value="procured">{t('admin.status_procured', 'Закуплено')}</option>
                      <option value="purchased">{t('admin.status_purchased', 'Куплено')}</option>
                      <option value="completed">{t('admin.status_completed', 'Завершено')}</option>
                      <option value="delivered">{t('admin.status_delivered', 'Доставлено')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {Number(order.subtotal).toFixed(2)} {currencySymbol}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {Number(order.deliveryFee).toFixed(2)} {currencySymbol}
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={order.purchased || false}
                        onChange={(e) => {
                          api.patch(`/admin/orders/${order.id}/purchased`, { purchased: e.target.checked })
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                              toast.success(e.target.checked 
                                ? t('admin.marked_purchased', 'Отмечено как купленное')
                                : t('admin.unmarked_purchased', 'Снята отметка о покупке'));
                            })
                            .catch(() => toast.error(t('admin.purchase_update_failed', 'Не удалось обновить статус покупки')));
                        }}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-xs text-gray-600">
                        {order.purchased ? '✓' : '✗'} Taoworld
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {order.purchasedAt && (
                      <div className="text-xs text-green-600">
                        {t('admin.purchased_at', 'Куплено')}: {new Date(order.purchasedAt).toLocaleString()}
                      </div>
                    )}
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
            <h2 className="text-xl font-bold text-gray-900">{t('admin.create_cargo')}</h2>
          </div>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                🔢 {t('admin.order_ids')}
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
                💰 {t('admin.cargo_cost')}
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
              {createCargoMutation.isPending ? `⏳ ${t('admin.creating')}` : `✓ ${t('admin.create_cargo')}`}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <h2 className="text-xl font-bold text-gray-900">{t('admin.mark_arrival')}</h2>
          </div>
          <form className="space-y-4" onSubmit={submitArrive}>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                🏷️ {t('admin.cargo_id')}
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
                💵 {t('admin.actual_cost')}
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
              {arriveMutation.isPending ? `⏳ ${t('admin.processing')}` : `✓ ${t('admin.mark_arrival')}`}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-xl font-bold text-gray-900">{t('admin.create_admin')}</h2>
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
                🔑 {t('admin.password')}
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
              {createAdminMutation.isPending ? `⏳ ${t('admin.creating')}` : `✓ ${t('admin.create_admin')}`}
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">💱</span>
            <h2 className="text-xl font-bold text-gray-900">{t('admin.currency_rates')}</h2>
          </div>
          
          <p className="text-sm text-gray-600">
            {t('admin.currency_note')}
          </p>

          {isLoadingCurrencyRates ? (
            <div className="text-center py-4 text-gray-500">
              <div className="text-3xl mb-2">💱</div>
              <p className="text-sm">{t('admin.loading_rates')}</p>
            </div>
          ) : isCurrencyRatesError ? (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="font-bold text-red-700 mb-1">{t('admin.rates_error')}</div>
              <div className="text-xs text-red-600 break-words">
                {(currencyRatesError as any)?.response?.status === 403
                  ? t('admin.access_denied')
                  : (currencyRatesError as any)?.response?.data?.message ||
                    (currencyRatesError as any)?.message ||
                    t('admin.error')}
              </div>
              <button
                onClick={() => refetchCurrencyRates()}
                className="mt-3 btn-secondary w-full"
              >
                🔄 {t('admin.retry')}
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
                              <span className="text-xs text-gray-600">{t('admin.rate')}:</span>
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
                              <span className="text-xs text-gray-600">{t('admin.markup')}:</span>
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
                            1 CNY (¥) = {rate.rateFromCNY} {rate.symbol} × {rate.markup} ({t('admin.markup')})
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
                            ✓ {t('admin.save')}
                          </button>
                          <button
                            onClick={() => setEditingCurrency(null)}
                            className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-lg hover:bg-gray-500"
                          >
                            ✕ {t('admin.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCurrency(rate)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                          >
                            ✎ {t('admin.edit')}
                          </button>
                          <button
                            onClick={() => toggleCurrencyActive(rate.currency, rate.isActive)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg ${
                              rate.isActive
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {rate.isActive ? `⏸ ${t('admin.disable')}` : `▶ ${t('admin.enable')}`}
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
              <p className="text-sm">{t('admin.no_rates')}</p>
              <button
                onClick={() => refetchCurrencyRates()}
                className="mt-3 btn-secondary w-full"
              >
                🔄 {t('admin.update')}
              </button>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <h2 className="text-xl font-bold text-gray-900">{t('admin.oauth_title')}</h2>
          </div>
          
          {oauthStatus?.connected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="font-bold text-green-800">{t('admin.oauth_connected')}</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{t('admin.account')}:</span> {oauthStatus.account || 'Unknown'}
                </p>
                {oauthStatus.expiresAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    {t('admin.token_valid_until')}: {new Date(oauthStatus.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => refetchOAuth()}
                  className="btn-secondary flex-1"
                >
                  🔄 {t('admin.refresh_status')}
                </button>
              <button
                onClick={() => refreshTokenMutation.mutate()}
                disabled={refreshTokenMutation.isPending}
                  className="btn-secondary flex-1"
              >
                {refreshTokenMutation.isPending ? `⏳ ${t('admin.refreshing')}` : `🔄 ${t('admin.refresh_token')}`}
              </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <span className="font-bold text-yellow-800">{t('admin.oauth_not_connected')}</span>
                </div>
                <p className="text-sm text-gray-700">
                  {t('admin.oauth_note')}
                </p>
              </div>
              <button
                onClick={handleConnectTaoWorld}
                className="btn-primary w-full"
              >
                🔗 {t('admin.connect_oauth')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

