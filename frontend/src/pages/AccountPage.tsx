import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderList } from '../api/orders';
import { useAuthStore } from '../state/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useSettingsStore } from '../state/settings';

export const AccountPage = () => {
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₽';

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-mine'],
    queryFn: fetchOrderList,
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-3xl">👤</span>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Профиль</div>
              <div className="text-xl font-bold text-gray-900 break-all">{email}</div>
              <div className="mt-2 inline-flex px-3 py-1 bg-gradient-to-r from-primary-100 to-amber-100 text-primary-700 font-semibold text-xs rounded-lg border border-primary-200">
                Роль: {role ?? 'user'}
              </div>
            </div>
          </div>
          <Link
            to="/settings"
            className="btn-secondary"
          >
            ⚡ Настройки
          </Link>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
              <span className="text-white text-xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Мои заказы</h2>
              <p className="text-xs text-gray-600">
                Отслеживайте статус ваших покупок
              </p>
            </div>
          </div>
          <Link to="/cart" className="btn-primary text-sm">
            🛒 В корзину
          </Link>
        </div>
        
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700">
          💡 Доставка начисляется при прибытии карго. Отслеживайте статус в деталях заказа.
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse" />
              <p className="text-sm text-gray-600">Загружаем заказы...</p>
            </div>
          </div>
        )}
        
        {!isLoading && (!orders || orders.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Пока нет заказов</h3>
            <p className="text-sm text-gray-600 mb-6">Начните делать покупки в нашем магазине</p>
            <Link to="/" className="btn-primary inline-block">
              🛍️ Перейти к товарам
            </Link>
          </div>
        )}
        
        <div className="grid sm:grid-cols-2 gap-4">
          {orders?.map((o) => (
            <Link 
              key={o.id} 
              to={`/order/${o.id}`}
              className="group p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-gray-900 text-lg">#{o.id}</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold border border-primary-200">
                  {o.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Итого:</span>
                  <span className="font-bold text-gray-900">
                    {o.total.toFixed(2)} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Товаров:</span>
                  <span>{o.items.length}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Доставка:</span>
                  <span>{o.delivery_fee.toFixed(2)} {currencySymbol}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 text-primary-600 text-sm font-medium group-hover:text-primary-700 flex items-center gap-1">
                <span>Подробнее</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

