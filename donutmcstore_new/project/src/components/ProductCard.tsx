import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Package, Sparkles, Check } from 'lucide-react';
import type { Product } from '../types/database';
import { useCartStore } from '../stores/cartStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1);
    }, 1500);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="group relative glass rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 blur-xl" />
      </div>

      {hasDiscount && (
        <div className="absolute top-4 left-4 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-lg opacity-50" />
            <div className="relative px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg">
              -{discountPercent}% OFF
            </div>
          </div>
        </div>
      )}

      {product.stock <= 5 && product.stock > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="px-2 py-1 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Low Stock
          </div>
        </div>
      )}

      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
              <Package className="w-20 h-20 text-gray-600 relative" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="relative p-5">
        <div className="mb-3">
          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 capitalize">
            {product.category}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold gradient-text">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.original_price!.toFixed(2)}
              </span>
            )}
          </div>
          <div
            className={`text-sm font-medium px-2 py-1 rounded-lg ${
              product.stock > 0
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {product.stock > 0 ? `${product.stock} left` : 'Sold out'}
          </div>
        </div>

        {product.stock > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center glass rounded-xl">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="p-2.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/5 rounded-l-xl"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-white font-semibold min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="p-2.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/5 rounded-r-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                isAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 hover:-translate-y-0.5'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 ${!isAdded && 'group-hover:opacity-100'} transition-opacity`} />
              <span className="relative flex items-center gap-2">
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        {product.stock === 0 && (
          <button
            disabled
            className="w-full py-3 px-4 glass rounded-xl text-gray-500 font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}
