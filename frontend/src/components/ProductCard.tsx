import { Link } from 'react-router-dom';
import type { Product } from '../api/products';
import { useAuthStore } from '../state/auth';
import { useSettingsStore } from '../state/settings';
import { useTranslation } from 'react-i18next';

type Props = {
  product: Product;
};

export const ProductCard = ({ product }: Props) => {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);
  const currency = useSettingsStore((s) => s.currency);
  
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
  
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-2 hover:shadow-2xl hover:border-primary-400 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-50 relative">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
        />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {!product.mock && (
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-green-500/95 text-white backdrop-blur-sm shadow-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              TAOBAO
            </span>
          )}
        {product.mock && (
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary-500/95 text-white backdrop-blur-sm border border-white/30 shadow-lg">
              MOCK
          </span>
        )}
        </div>
        
        {product.rating && (
          <div className="absolute top-3 right-3 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white/95 backdrop-blur-md text-amber-600 flex items-center gap-1 shadow-lg">
            <span>⭐</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
        
        {product.sales && product.sales > 1000 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-red-500 to-orange-500 backdrop-blur-sm text-white shadow-lg flex items-center gap-1">
            <span>🔥</span>
            <span>{product.sales}+</span>
          </div>
        )}

        {product.inventory !== undefined && product.inventory < 10 && product.inventory > 0 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/95 text-white backdrop-blur-sm shadow-lg">
            ⚠️ {t('product_card.left', 'Осталось')} {product.inventory}
          </div>
        )}

        {/* Quick view button */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="text-xs text-center py-2 bg-white/95 backdrop-blur-md text-gray-900 rounded-xl font-bold shadow-xl">
            👁️ {t('product_card.quick_view', 'Быстрый просмотр')}
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-bold line-clamp-2 min-h-[40px] text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">
        {product.title}
      </h3>
      
        {/* Brand or Shop */}
        {(product.brand || product.shop_name) && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span>🏪</span>
            <span className="truncate font-medium">{product.brand || product.shop_name}</span>
          </div>
        )}

        {/* Price Section */}
        <div className="pt-3 border-t-2 border-gray-100 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            {product.final_item_price.toFixed(2)} {currencySymbol}
          </div>
          {role === 'admin' && (
              <span className="text-[11px] text-gray-400 font-semibold">
              {product.price_cny} ¥
            </span>
          )}
        </div>

          {/* Stock indicator */}
          {product.inventory !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${product.inventory > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-[11px] font-semibold ${product.inventory > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.inventory > 0 ? t('product_card.in_stock', 'В наличии') : t('product_card.out_of_stock', 'Нет в наличии')}
              </span>
            </div>
          )}
      </div>
      
        {/* Hover Action Button */}
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <div className="text-xs text-center py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-md">
          {t('product_card.details', 'Подробнее')} →
          </div>
        </div>
      </div>
    </Link>
  );
};

