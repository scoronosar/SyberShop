import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSettingsStore } from '../state/settings';
import { createCargo, arriveCargo } from '../api/logistics';
import { createAdmin } from '../api/auth';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

export const AdminPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      return res.data as any[];
    },
  });
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₽';
  const queryClient = useQueryClient();

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
              {data?.map((order, idx) => (
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
      </div>
    </div>
  );
};

