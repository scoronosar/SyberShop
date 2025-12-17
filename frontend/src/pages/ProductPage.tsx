import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProduct } from '../api/products';
import { addToCart } from '../api/cart';
import toast from 'react-hot-toast';
import { useAuthStore } from '../state/auth';
import { useSettingsStore } from '../state/settings';
import { Modal } from '../components/Modal';

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₽';
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [openPriceModal, setOpenPriceModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id, currency],
    queryFn: () => fetchProduct(id!, currency),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: () => addToCart(id!, qty, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Добавлено в корзину');
      navigate('/cart');
    },
    onError: () => toast.error('Не удалось добавить в корзину'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse" />
          <p className="text-gray-600 font-medium">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="aspect-square rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-gray-100 to-gray-50 ring-1 ring-gray-200">
          <img src={data.images?.[0]} alt={data.title} className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {data.images?.map((img, idx) => (
            <div key={img} className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <img src={img} className="w-full h-full object-cover" alt={`${data.title} ${idx + 1}`} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {data.mock && (
            <span className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold border border-primary-200">
              Mock
            </span>
          )}
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
            Taobao
          </span>
          {data.rating && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-200 flex items-center gap-1">
              <span>⭐</span>
              <span>{data.rating}</span>
            </span>
          )}
          {data.sales && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
              🔥 {data.sales} продаж
            </span>
          )}
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-gray-900">
          {data.title}
        </h1>

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              {data.final_item_price.toFixed(2)} {currencySymbol}
            </div>
            {role === 'admin' && (
              <span className="text-base text-gray-500 font-semibold">
                ({data.price_cny} ¥)
              </span>
            )}
          </div>
          
          {role === 'admin' && (
            <div className="space-y-3">
              <button
                className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                onClick={() => setShowBreakdown((v) => !v)}
              >
                <span>{showBreakdown ? '▼' : '▶'}</span>
                <span>{showBreakdown ? 'Скрыть расчёт' : 'Показать расчёт'}</span>
              </button>
              {showBreakdown && (
                <div className="grid grid-cols-2 gap-3 text-sm animate-slide-up">
                  <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <div className="font-bold text-orange-700 mb-1">Курс + наценка</div>
                    <div className="text-lg font-semibold text-orange-900">
                      {data.converted_with_markup.toFixed(2)} {currencySymbol}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <div className="font-bold text-slate-700 mb-1">Сервисный сбор</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {data.service_fee_amount.toFixed(2)} {currencySymbol}
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-gray-600 bg-white/50 p-3 rounded-lg">
                    💡 Расчёт на сервере: rate × 1.05 → service +3%. Доставка будет добавлена при прибытии карго.
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
            onClick={() => setOpenPriceModal(true)}
          >
            <span>ℹ️</span>
            <span>Детали цены</span>
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-sm font-bold text-gray-800">Количество</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-28 input-field text-center font-semibold"
            />
            <button
              onClick={() => addMutation.mutate()}
              className="btn-primary flex-1"
            >
              🛒 Добавить в корзину
            </button>
          </div>
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            📦 Доставка будет начислена после прибытия груза (cargo arrival).
          </div>
        </div>
      </div>
      <Modal open={openPriceModal} onClose={() => setOpenPriceModal(false)} title="💰 Детали цены">
        {role === 'admin' ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Цена в CNY</div>
              <div className="text-xl font-bold text-gray-900">{data.price_cny} ¥</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Курс + наценка</div>
              <div className="text-xl font-bold text-gray-900">
                {data.converted_with_markup.toFixed(2)} {currencySymbol}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Сервисный сбор</div>
              <div className="text-xl font-bold text-gray-900">
                {data.service_fee_amount.toFixed(2)} {currencySymbol}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary-100 to-amber-100 rounded-xl border-2 border-primary-300">
              <div className="text-sm text-gray-700 mb-1">Итоговая цена</div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {data.final_item_price.toFixed(2)} {currencySymbol}
              </div>
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              ℹ️ Расчёт на сервере. Доставка добавится при прибытии карго.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-primary-100 to-amber-100 rounded-xl border-2 border-primary-300 text-center">
              <div className="text-sm text-gray-700 mb-2">Итоговая цена</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {data.final_item_price.toFixed(2)} {currencySymbol}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-700">
                ✓ Цена включает конвертацию и сервисный сбор.
              </p>
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              📦 Доставка будет рассчитана при прибытии карго и добавлена к заказу.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

