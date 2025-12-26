import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCart, removeCartItem } from '../api/cart';
import { createOrder } from '../api/orders';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../state/settings';
import { useTranslation } from 'react-i18next';

export const CartPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    UZS: 'сўм',
    TJS: 'ЅМ',
    KZT: '₸',
    CNY: '¥',
  };
  const currencySymbol = currencySymbols[currency] || currency;

  const parseSkuLabel = (sku?: string) => {
    if (!sku) return null;
    try {
      const parsed = JSON.parse(sku);
      const props: Array<{ name: string; value: string }> = Array.isArray(parsed?.props) ? parsed.props : [];
      if (!props.length) return null;
      return props.map((p) => `${p.name}: ${p.value}`).join(' • ');
    } catch {
      return sku.length > 120 ? `${sku.slice(0, 120)}…` : sku;
    }
  };

  const parseSkuPicUrl = (sku?: string) => {
    if (!sku) return null;
    try {
      const parsed = JSON.parse(sku);
      return (parsed?.pic_url || parsed?.picUrl || null) as string | null;
    } catch {
      return null;
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast.success(t('cart.order_created'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/order/${order.id}`);
    },
    onError: () => toast.error(t('cart.order_failed')),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      toast.success(t('cart.removed'));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error(t('cart.remove_failed')),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse" />
          <p className="text-gray-600 font-medium">{t('cart.loading')}</p>
        </div>
      </div>
    );
  }
  
  const items = data?.items ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <span className="text-white text-xl">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{t('cart.title')}</h1>
              <div className="text-sm text-gray-500">{items.length} {t('cart.items_count')}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            💡 {t('cart.server_prices')}
          </div>
        </div>
        
        {items.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('cart.empty')}</h3>
            <p className="text-gray-600 mb-6">{t('cart.empty_hint')}</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mx-auto"
            >
              {t('cart.go_to_shopping')}
            </button>
          </div>
        )}
        
        {items.map((item) => (
          <div key={item.id} className="card p-4 hover:shadow-glow transition-all duration-300">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0 ring-1 ring-gray-200">
                <img src={parseSkuPicUrl(item.sku) || item.images?.[0]} className="w-full h-full object-cover" alt={item.title} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                    {parseSkuLabel(item.sku) && (
                      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 inline-block">
                        {parseSkuLabel(item.sku)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                    className="px-3 py-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('cart.remove')}
                  >
                    🗑️
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg font-semibold">
                    {item.qty} {t('cart.quantity')}
                  </div>
                  <div className="text-gray-600">
                    × {item.price.toFixed(2)} {currencySymbol}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('cart.total')}:</span>
                    <span className="text-lg font-extrabold text-primary-600">
                      {item.lineTotal.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="lg:col-span-1">
        <div className="card p-6 space-y-6 sticky top-24">
          <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📋</span>
            <span>{t('cart.total')}</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{t('cart.subtotal')}</span>
              <span className="text-lg font-bold text-gray-900">
                {data?.subtotal.toFixed(2)} {currencySymbol}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-gray-700">{t('cart.delivery')}</span>
              <span className="text-xs text-blue-700 font-medium">{t('cart.delivery_on_arrival')}</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            📦 {t('cart.delivery_note')}
          </div>
          
          <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
            <button
              disabled={!items.length}
              onClick={() => createOrderMutation.mutate()}
              className="btn-primary w-full text-lg"
            >
              ✓ {t('cart.checkout')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary w-full"
            >
              ← {t('cart.continue_shopping')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

