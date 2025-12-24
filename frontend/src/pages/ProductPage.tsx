import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProduct } from '../api/products';
import { addToCart } from '../api/cart';
import toast from 'react-hot-toast';
import { useAuthStore } from '../state/auth';
import { useSettingsStore } from '../state/settings';
import { Modal } from '../components/Modal';
import i18n from '../i18n';

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'delivery'>('description');
  const [showSkuModal, setShowSkuModal] = useState(false);
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const currency = useSettingsStore((s) => s.currency);
  const language = useSettingsStore((s) => s.language);
  
  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    'RUB': '₽',
    'USD': '$',
    'UZS': 'сўм',
    'TJS': 'ЅМ',
    'KZT': '₸',
    'CNY': '¥',
  };
  const currencySymbol = currencySymbols[currency] || currency;
  
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [openPriceModal, setOpenPriceModal] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id, currency],
    queryFn: () => fetchProduct(id!, currency),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: ({ sku }: { sku?: string }) => addToCart(id!, qty, currency, sku),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Добавлено в корзину');
      setShowSkuModal(false);
      setSelectedOptions({});
      setSelectedSku(null);
      navigate('/cart');
    },
    onError: () => toast.error('Не удалось добавить в корзину'),
  });

  // Handle "Add to Cart" button click
  const handleAddToCartClick = () => {
    // If product has SKU options, show modal for selection
    if (data?.sku_list && data.sku_list.length > 1) {
      setShowSkuModal(true);
    } else {
      // If no SKU options or only one variant, add directly
      addMutation.mutate({});
    }
  };

  const skuList = (data?.sku_list ?? []) as any[];

  const skuOptionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    const details = new Map<string, Map<string, any>>();

    skuList.forEach((sku: any) => {
      (sku.properties ?? []).forEach((prop: any) => {
        const propName = prop.prop_name || prop.name || 'Опция';
        const propValue = prop.value_name || prop.value || '';

        if (!groups.has(propName)) {
          groups.set(propName, new Set());
          details.set(propName, new Map());
        }

        groups.get(propName)!.add(propValue);

        const quantity = Number.parseInt(sku.quantity ?? sku.inventory ?? '0', 10) || 0;
        const status = (sku.status ?? '').toString().toLowerCase();
        const available = quantity > 0 && status !== 'inactive' && status !== 'cancel';

        const current = details.get(propName)!.get(propValue);
        details.get(propName)!.set(propValue, {
          image: current?.image || sku.pic_url || sku.images?.[0] || prop.image,
          available: Boolean(current?.available) || available,
          quantity: Math.max(current?.quantity ?? 0, quantity),
          status: current?.status || status,
        });
      });
    });

    return { groups, details };
  }, [skuList]);

  const matchingSku = useMemo(() => {
    if (!skuList.length) return null;
    const entries = Object.entries(selectedOptions);
    if (!entries.length) return null;
    return (
      skuList.find((sku: any) => {
        return entries.every(([propName, propValue]) => {
          return (sku.properties ?? []).some(
            (p: any) =>
              (p.prop_name || p.name) === propName &&
              (p.value_name || p.value) === propValue,
          );
        });
      }) ?? null
    );
  }, [selectedOptions, skuList]);

  useEffect(() => {
    if (!showSkuModal) return;
    if (!matchingSku) return;
    const matchingSkuId = (matchingSku?.sku_id ?? '').toString();
    const matchingMpSkuId = (matchingSku?.mp_sku_id ?? matchingSku?.mp_skuId ?? matchingSku?.mp_skuID ?? '').toString();
    const selectedSkuId = (selectedSku?.sku_id ?? '').toString();
    const selectedMpSkuId = (selectedSku?.mp_sku_id ?? selectedSku?.mp_skuId ?? selectedSku?.mp_skuID ?? '').toString();

    // Prevent infinite loops: if we're already on this SKU, do nothing
    if ((matchingSkuId && matchingSkuId === selectedSkuId) || (matchingMpSkuId && matchingMpSkuId === selectedMpSkuId)) return;

    // Some items return empty sku_id/mp_sku_id. Fall back to a stable composite key.
    const skuKey = (sku: any) => {
      if (!sku) return '';
      const mp = (sku?.mp_sku_id ?? sku?.mp_skuId ?? sku?.mp_skuID ?? '').toString();
      const sid = (sku?.sku_id ?? '').toString();
      if (mp) return `mp:${mp}`;
      if (sid) return `sku:${sid}`;
      const pic = (sku?.pic_url ?? sku?.picUrl ?? sku?.images?.[0] ?? '').toString();
      const price = (sku?.coupon_price ?? sku?.promotion_price ?? sku?.price ?? '').toString();
      const props = Array.isArray(sku?.properties)
        ? sku.properties
            .map((p: any) => `${p?.prop_name ?? p?.name ?? ''}=${p?.value_name ?? p?.value ?? ''}`)
            .sort()
            .join('|')
        : '';
      return `p:${price};i:${pic};props:${props}`;
    };

    if (skuKey(matchingSku) && skuKey(matchingSku) === skuKey(selectedSku)) return;

    setSelectedSku(matchingSku);

    const skuImg = matchingSku.pic_url || matchingSku.images?.[0];
    if (skuImg && data?.images?.length) {
      const idx = data.images.indexOf(skuImg);
      if (idx >= 0) setSelectedImage(idx);
    }
  }, [data?.images, matchingSku, selectedSku, showSkuModal]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data.title,
        text: `Проверьте этот товар: ${data.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована!');
    }
  };

  // Taobao SKU helpers (см. documentation2.txt: sku_list.quantity, pic_url, mp_sku_id/mp_skuId, price/promotion_price/coupon_price в "фенах")
  const pricingMultiplier = data.price_cny > 0 ? data.final_item_price / data.price_cny : 0;

  const getSkuQuantity = (sku: any) => Number.parseInt(sku?.quantity ?? sku?.inventory ?? '0', 10) || 0;
  const getSkuImage = (sku: any) => sku?.pic_url || sku?.images?.[0] || null;
  const getSkuPriceCny = (sku: any) => {
    const cents =
      Number.parseInt(sku?.coupon_price ?? sku?.promotion_price ?? sku?.price ?? '0', 10) || 0;
    return cents / 100;
  };
  const getSkuFinalPrice = (sku: any) => {
    const cny = getSkuPriceCny(sku);
    if (!pricingMultiplier) return data.final_item_price;
    return cny * pricingMultiplier;
  };

  const localizePropName = (name: string) => {
    const n = (name || '').trim();
    const lng = language || 'ru';
    const dict: Record<string, Record<string, string>> = {
      '颜色分类': { ru: 'Цвет', en: 'Color', tg: 'Ранг', kk: 'Түс', uz: 'Rang', fa: 'رنگ', ky: 'Түс' },
      '颜色': { ru: 'Цвет', en: 'Color', tg: 'Ранг', kk: 'Түс', uz: 'Rang', fa: 'رنگ', ky: 'Түс' },
      '尺寸': { ru: 'Размер', en: 'Size', tg: 'Андоза', kk: 'Өлшем', uz: "O'lcham", fa: 'اندازه', ky: 'Өлчөм' },
      '尺码': { ru: 'Размер', en: 'Size', tg: 'Андоза', kk: 'Өлшем', uz: "O'lcham", fa: 'اندازه', ky: 'Өлчөм' },
    };
    return dict[n]?.[lng] || dict[n]?.en || n;
  };

  // Preselect cheapest SKU (so product page shows the minimum variant price and modal opens with selection)
  useEffect(() => {
    if (!data) return;
    if (!skuList.length) return;
    if (selectedSku || Object.keys(selectedOptions).length) return;

    const cheapest = [...skuList].sort((a, b) => getSkuPriceCny(a) - getSkuPriceCny(b))[0];
    if (!cheapest) return;
    setSelectedSku(cheapest);

    const nextOptions: Record<string, string> = {};
    (cheapest.properties ?? []).forEach((p: any) => {
      const propName = p.prop_name || p.name || 'Опция';
      const propValue = p.value_name || p.value || '';
      if (propName && propValue) nextOptions[propName] = propValue;
    });
    setSelectedOptions(nextOptions);

    const skuImg = cheapest.pic_url || cheapest.images?.[0];
    if (skuImg && data.images?.length) {
      const idx = data.images.indexOf(skuImg);
      if (idx >= 0) setSelectedImage(idx);
    }
  }, [data, skuList, selectedOptions, selectedSku]);

  const buildSkuPayloadString = (sku: any) => {
    const mpSkuId = (sku?.mp_sku_id ?? sku?.mp_skuId ?? sku?.mp_skuID ?? '').toString();
    const skuId = (sku?.sku_id ?? '').toString();
    const pic_url = (sku?.pic_url ?? sku?.picUrl ?? sku?.images?.[0] ?? undefined) as string | undefined;
    const props = (sku?.properties ?? [])
      .map((p: any) => ({
        prop_id: p?.prop_id?.toString?.() ?? p?.prop_id ?? undefined,
        value_id: p?.value_id?.toString?.() ?? p?.value_id ?? undefined,
        name: (p?.prop_name ?? p?.name ?? '').toString(),
        value: (p?.value_name ?? p?.value ?? '').toString(),
      }))
      .filter((p: any) => p.name && p.value)
      .sort((a: any, b: any) => (a.name + a.value).localeCompare(b.name + b.value));

    return JSON.stringify({
      mp_sku_id: mpSkuId || undefined,
      sku_id: skuId || undefined,
      pic_url,
      props,
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">Главная</button>
        <span>›</span>
        {data.category && (
          <>
            <span>{data.category}</span>
            <span>›</span>
          </>
        )}
        <span className="text-gray-900 font-semibold truncate">{data.title.slice(0, 50)}...</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div 
            className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-50 ring-2 ring-gray-200 cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          >
            <img 
              src={data.images?.[selectedImage] || data.images?.[0]} 
              alt={data.title} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
            />
            {!data.mock && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>REAL TAOBAO</span>
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }}
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold rounded-lg shadow-lg hover:bg-white transition-all"
            >
              🔍 Увеличить
            </button>
          </div>

          {/* Thumbnails */}
          {data.images && data.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {data.images.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden transition-all cursor-pointer ${
                    selectedImage === idx
                      ? 'ring-3 ring-primary-500 shadow-lg scale-105'
                      : 'ring-2 ring-gray-200 hover:ring-primary-300 hover:shadow-md'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`${data.title} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
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
              <span>{data.rating.toFixed(1)}</span>
            </span>
          )}
          {data.sales && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
              🔥 {data.sales} продаж
            </span>
          )}
          {data.inventory !== undefined && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
              📦 {data.inventory} в наличии
            </span>
          )}
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-gray-900">
          {data.title}
        </h1>

        {/* Additional Info */}
        {(data.brand || data.category || data.shop_name) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {data.brand && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">🏷️ Бренд:</span>
                <span>{data.brand}</span>
              </div>
            )}
            {data.category && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">📂 Категория:</span>
                <span>{data.category}</span>
              </div>
            )}
            {data.shop_name && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">🏪 Магазин:</span>
                <span>{data.shop_name}</span>
              </div>
            )}
          </div>
        )}

        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              {(selectedSku ? getSkuFinalPrice(selectedSku) : data.final_item_price).toFixed(2)} {currencySymbol}
            </div>
            {role === 'admin' && (
              <span className="text-base text-gray-500 font-semibold">
                ({(selectedSku ? getSkuPriceCny(selectedSku) : data.price_cny).toFixed(2)} ¥)
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

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <span>🔗</span>
            <span>Поделиться</span>
          </button>
          <button
            onClick={() => toast.success('Добавлено в избранное (скоро)')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <span>❤️</span>
            <span>В избранное</span>
          </button>
        </div>

        {/* Quick Info about variants */}
        {data.sku_list && data.sku_list.length > 1 && (
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <div className="text-sm font-bold text-gray-900">Доступны варианты</div>
                  <div className="text-xs text-gray-600">
                    {data.sku_list.length} вариантов товара
                  </div>
                </div>
              </div>
                <button
                onClick={() => setShowSkuModal(true)}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all hover:scale-105 shadow-md"
              >
                Выбрать →
                </button>
            </div>
          </div>
        )}

        {/* Add to Cart Section */}
        <div className="card p-6 space-y-4 bg-gradient-to-br from-white to-primary-50/20">
              <button
            onClick={handleAddToCartClick}
            disabled={addMutation.isPending}
            className="w-full btn-primary text-lg font-bold py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
          >
            {addMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Добавляем...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🛒</span>
                <span>Добавить в корзину</span>
                {data.sku_list && data.sku_list.length > 1 && (
                  <span className="text-sm opacity-75">• Выбрать вариант</span>
                )}
              </>
            )}
              </button>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-lg">📦</span>
              <span className="font-semibold">Доставка при прибытии</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-lg">✓</span>
              <span className="font-semibold">Проверка качества</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Section */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('description')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'description'
                ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📝 Описание
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'specs'
                ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Характеристики
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'delivery'
                ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🚚 Доставка
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'description' && (
            <div className="space-y-6">
              {data.video_url && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <video 
                    controls 
                    className="w-full"
                    poster={data.images?.[0]}
                  >
                    <source src={data.video_url} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
              )}
              {data.description ? (
                <div 
                  className="prose max-w-none text-gray-700 lg:prose-lg prose-img:mx-auto prose-a:text-primary-600"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-sm">Описание будет добавлено</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              {data.properties && data.properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.properties.map((prop: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-800 min-w-[140px]">{prop.name || prop.prop_name}:</span>
                      <span className="text-gray-700">{prop.value || prop.value_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-sm">Характеристики будут добавлены</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-2xl">📦</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Доставка из Китая</h4>
                      <p className="text-xs text-gray-600">Международная доставка</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Товар закупается напрямую с Taobao</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Отправка на склад консолидации в Китае</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Международная доставка до вашей страны</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-2xl">💰</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Оплата доставки</h4>
                      <p className="text-xs text-gray-600">После прибытия груза</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Доставка рассчитывается по весу/объёму</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Оплата после прибытия на склад</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Трекинг на всех этапах</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⏱️</span>
                  <span>Примерные сроки</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-2xl text-primary-600 mb-1">2-5</div>
                    <div className="text-gray-600">дней на закупку</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-2xl text-primary-600 mb-1">3-7</div>
                    <div className="text-gray-600">дней консолидация</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-2xl text-primary-600 mb-1">15-30</div>
                    <div className="text-gray-600">дней международная доставка</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Modal open={isZoomed} onClose={() => setIsZoomed(false)} title="">
        <div className="relative">
          <img 
            src={data.images?.[selectedImage] || data.images?.[0]} 
            alt={data.title}
            className="w-full h-auto rounded-xl"
          />
          {data.images && data.images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {data.images.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    selectedImage === idx
                      ? 'ring-3 ring-primary-500'
                      : 'ring-1 ring-gray-300 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
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

      {/* SKU Selection Modal (Taobao Style) */}
      <Modal 
        open={showSkuModal} 
        onClose={() => setShowSkuModal(false)} 
        title=""
      >
        <div className="space-y-6">
          {/* Modal Header */}
          <div className="flex items-start gap-4 pb-6 border-b-2 border-gray-200">
            {/* Product Image */}
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-100">
              <img 
                src={getSkuImage(selectedSku) || data.images?.[0]} 
                alt={data.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Price and Stock */}
            <div className="flex-1 space-y-2">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {selectedSku ? getSkuFinalPrice(selectedSku).toFixed(2) : data.final_item_price.toFixed(2)} {currencySymbol}
              </div>
              {selectedSku && (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    getSkuQuantity(selectedSku) > 0 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {getSkuQuantity(selectedSku) > 0 ? `✓ В наличии: ${getSkuQuantity(selectedSku)} шт.` : '✕ Нет в наличии'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SKU Options Selector */}
          {skuList.length > 0 && (
            <div className="space-y-6">
              {Array.from(skuOptionGroups.groups.entries()).map(([propName, values]) => {
                const details = skuOptionGroups.details.get(propName)!;
                const hasImages = Array.from(values).some((v) => details.get(v)?.image);
                  const isColorProperty = propName.toLowerCase().includes('color') || 
                                         propName.includes('颜色') || 
                                         propName.toLowerCase().includes('цвет');
                
                return (
                  <div key={propName} className="space-y-3">
                    <label className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">{isColorProperty ? '🎨' : '📏'}</span>
                      <span>{localizePropName(propName)}:</span>
                      {selectedOptions[propName] && (
                        <span className="text-primary-600">
                          {selectedOptions[propName]}
                        </span>
                      )}
                      {!selectedOptions[propName] && (
                        <span className="text-red-500 text-sm font-normal">* {i18n.t('product.select_variant', 'Выберите вариант')}</span>
                      )}
                    </label>
                    
                    <div className={`grid gap-3 ${hasImages && isColorProperty ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-5'}`}>
                      {Array.from(values).map((value) => {
                        const detail = details.get(value);
                        const isSelected = selectedOptions[propName] === value;
                        
                        return (
                          <button
                            key={value}
                            onClick={() => {
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [propName]: value,
                              }));
                            }}
                            disabled={!detail?.available}
                            className={`relative p-3 rounded-xl border-2 transition-all duration-200 font-semibold text-sm ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xl scale-105 ring-4 ring-primary-200'
                                : detail?.available
                                ? 'border-gray-300 hover:border-primary-400 bg-white hover:shadow-lg hover:scale-105'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {detail?.image && hasImages && isColorProperty ? (
                              <div className="space-y-2">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img 
                                    src={detail.image} 
                                    alt={value}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-xs text-center truncate leading-tight">{value}</div>
                              </div>
                            ) : (
                              <div className="text-center py-2">{value}</div>
                            )}
                            {!detail?.available && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
                                <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded-md shadow-sm">
                                  {i18n.t('product.out_of_stock', 'Нет в наличии')}
                                </span>
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <span className="text-white text-sm font-bold">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

                {/* Quantity Selector */}
                <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                  <label className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-xl">🔢</span>
                    <span>{i18n.t('product.quantity', 'Количество')}:</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="px-5 py-3 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 text-lg transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                        className="w-24 text-center font-bold text-xl border-0 focus:ring-0 py-3 bg-white"
                      />
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="px-5 py-3 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {selectedSku && getSkuQuantity(selectedSku) > 0 && (
                      <div className="text-sm text-gray-600 font-medium">
                        Максимум: <span className="font-bold text-primary-600">{getSkuQuantity(selectedSku)}</span> шт.
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="pt-6 border-t-2 border-gray-200 sticky bottom-0 bg-white/95 backdrop-blur-sm">
                  {!Array.from(skuOptionGroups.groups.keys()).every((k) => Boolean(selectedOptions[k])) ? (
                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-center">
                      <div className="text-amber-700 font-bold mb-1">⚠️ {i18n.t('product.select_all', 'Выберите все варианты')}</div>
                      <div className="text-xs text-amber-600">
                        {i18n.t('product.select_all_hint', 'Необходимо выбрать все параметры товара перед добавлением в корзину')}
                      </div>
                    </div>
                  ) : !selectedSku || getSkuQuantity(selectedSku) === 0 ? (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                      <div className="text-red-700 font-bold mb-1">✕ {i18n.t('product.variant_unavailable', 'Вариант недоступен')}</div>
                      <div className="text-xs text-red-600">
                        {i18n.t('product.variant_unavailable_hint', 'Выбранный вариант нет в наличии. Попробуйте выбрать другой.')}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => addMutation.mutate({ sku: buildSkuPayloadString(selectedSku) })}
                      disabled={addMutation.isPending}
                      className="w-full bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500 hover:from-primary-600 hover:to-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {addMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{i18n.t('product.adding', 'Добавляем в корзину...')}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">✓</span>
                          <span>{i18n.t('product.add_to_cart', 'Добавить в корзину')}</span>
                          <span className="text-sm opacity-90">
                            • {qty} шт. • {(getSkuFinalPrice(selectedSku) * qty).toFixed(2)} {currencySymbol}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
    </div>
  );

};