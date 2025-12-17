import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderStatus } from '../api/orders';
import { fetchTracking } from '../api/logistics';
import { useSettingsStore } from '../state/settings';
import { Timeline } from '../components/Timeline';

export const OrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₽';

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderStatus(id!),
    enabled: !!id,
  });

  const { data: tracking } = useQuery({
    queryKey: ['tracking', id],
    queryFn: () => fetchTracking(id!),
    enabled: !!id,
  });

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse" />
          <p className="text-gray-600 font-medium">Загружаем заказ...</p>
        </div>
      </div>
    );
  }

  const cargos = tracking?.cargos ?? [];
  const steps =
    cargos.length > 0
      ? [
          { title: 'Заказ создан', status: 'done' as const },
          { title: 'В пути/консолидация', status: 'done' },
          {
            title: 'Карго прибыло',
            status: tracking?.status === 'arrived' ? 'done' : 'current',
            description: cargos[0]?.status ?? '',
          },
          {
            title: 'Начислена доставка',
            status: tracking?.delivery_fee ? 'done' : 'pending',
            description: tracking?.delivery_fee ? `Доставка: ${tracking.delivery_fee.toFixed(2)}` : undefined,
          },
        ]
      : [
          { title: 'Заказ создан', status: 'done' as const },
          { title: 'Ожидает отправки', status: 'current' as const },
          { title: 'Карго прибудет', status: 'pending' as const },
        ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl">📦</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Заказ #{order.id}</h1>
          <p className="text-sm text-gray-600">Детали и статус вашего заказа</p>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-br from-white to-primary-50/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary-200">
            <span className="text-gray-700 font-medium">Статус заказа</span>
            <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-bold border border-primary-300">
              {order.status}
            </span>
          </div>
          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-gray-700">Товары</span>
            <span className="font-bold text-gray-900">{order.subtotal.toFixed(2)} {currencySymbol}</span>
          </div>
          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-gray-700">Доставка</span>
            <span className="font-bold text-gray-900">{order.delivery_fee.toFixed(2)} {currencySymbol}</span>
          </div>
          <div className="flex justify-between p-5 bg-gradient-to-r from-primary-100 to-amber-100 rounded-xl border-2 border-primary-300">
            <span className="text-lg font-bold text-gray-800">Итого</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              {order.total.toFixed(2)} {currencySymbol}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🛍️</span>
          <h3 className="text-xl font-bold text-gray-900">Товары в заказе</h3>
        </div>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-600">Количество: {item.qty} шт.</div>
              </div>
              <span className="font-bold text-primary-600">{item.price.toFixed(2)} {currencySymbol}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🚚</span>
          <h3 className="text-xl font-bold text-gray-900">Логистика и доставка</h3>
        </div>
        {tracking ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Статус доставки:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm border border-blue-300">
                  {tracking.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Стоимость доставки:</span>
                <span className="font-bold text-blue-900">
                  {tracking.delivery_fee.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>
            
            {cargos.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Связанные карго: {cargos.length}
                </div>
                <div className="space-y-2">
                  {cargos.map((c: any) => (
                    <div key={c.id ?? c.cargoId} className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-xs font-mono text-gray-600">Карго: {c.id ?? c.cargoId}</span>
                      <span className="text-xs font-semibold text-purple-700">
                        {c.status ?? 'unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t-2 border-dashed border-gray-300">
              <Timeline steps={steps} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-600">Данные о доставке пока не доступны</p>
          </div>
        )}
      </div>
    </div>
  );
};

