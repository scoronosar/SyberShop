import { Link } from 'react-router-dom';
import type { Product } from '../api/products';
import { useAuthStore } from '../state/auth';
import { useSettingsStore } from '../state/settings';

type Props = {
  product: Product;
};

export const ProductCard = ({ product }: Props) => {
  const role = useAuthStore((s) => s.role);
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₽';
  
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white border border-gray-200 rounded-2xl p-3 shadow-soft hover:-translate-y-1 hover:shadow-glow-lg hover:border-primary-300 transition-all duration-300 text-sm"
    >
      <div className="aspect-square overflow-hidden rounded-xl mb-3 bg-gradient-to-br from-gray-100 to-gray-50 relative">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {product.mock && (
          <span className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary-100 text-primary-600 backdrop-blur-sm border border-primary-200 shadow-sm">
            Mock
          </span>
        )}
        
        {product.rating && (
          <div className="absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold rounded-lg bg-white/90 backdrop-blur-sm text-yellow-600 flex items-center gap-1 shadow-sm">
            <span>⭐</span>
            <span>{product.rating}</span>
          </div>
        )}
        
        {product.sales && product.sales > 1000 && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-500/90 backdrop-blur-sm text-white shadow-sm">
            🔥 {product.sales}+ продаж
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-semibold mt-1 line-clamp-2 min-h-[40px] text-gray-800 group-hover:text-primary-600 transition-colors">
        {product.title}
      </h3>
      
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-baseline justify-between">
          <div className="text-lg font-extrabold text-primary-600 group-hover:text-primary-700">
            {product.final_item_price.toFixed(2)} {currencySymbol}
          </div>
          {role === 'admin' && (
            <span className="text-xs text-gray-500 font-medium">
              {product.price_cny} ¥
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="text-xs text-center py-1.5 bg-primary-50 text-primary-700 rounded-lg font-medium">
          Подробнее →
        </div>
      </div>
    </Link>
  );
};

