import { useState } from 'react';
import { X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!minecraftUsername.trim()) {
      setError('Please enter your Minecraft username');
      return;
    }

    if (!user) {
      setError('You must be logged in to checkout');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in again');
        setIsSubmitting(false);
        return;
      }

      const checkoutItems = items.map((item) => ({
        product_id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      }));

      // Enforce $2.00 minimum order
      const MINIMUM_ORDER = 2.00;
      const currentTotal = getTotal();
      if (currentTotal < MINIMUM_ORDER) {
        setError(`Minimum order amount is $${MINIMUM_ORDER.toFixed(2)}`);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            items: checkoutItems,
            minecraft_username: minecraftUsername.trim(),
            success_url: `${window.location.origin}/order-success`,
            cancel_url: `${window.location.origin}/cart`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMinecraftUsername('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Checkout</h2>
            <p className="text-sm text-gray-400">Secure payment with Stripe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minecraft Username
            </label>
            <input
              type="text"
              value={minecraftUsername}
              onChange={(e) => setMinecraftUsername(e.target.value)}
              placeholder="Your in-game name"
              className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is where your items will be delivered
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-4 border border-white/10">
            <div className="space-y-2 mb-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    {item.product.title} x{item.quantity}
                  </span>
                  <span className="text-white">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-white font-semibold">Total</span>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ${getTotal().toFixed(2)}
              </span>
            </div>
            {getTotal() < 2.00 && (
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400 text-center">
                  ⚠️ Minimum order: $2.00 (Add ${(2.00 - getTotal()).toFixed(2)} more)
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">
              Payments are secured and processed by Stripe
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || getTotal() < 2.00}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ${getTotal().toFixed(2)}
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            By completing your purchase you agree to our terms of service
          </p>
        </form>
      </div>
    </div>
  );
}
