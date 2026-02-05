import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, Loader2, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Order, OrderItem, Product } from '../types/database';

interface OrderWithItems extends Order {
  order_items: (OrderItem & { products: Product })[];
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
  },
};

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as OrderWithItems[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-full flex items-center justify-center border border-white/10">
                <Package className="w-16 h-16 text-gray-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text-animated mb-3">No orders yet</h2>
            <p className="text-gray-400 mb-8 text-lg">Start shopping to see your order history here!</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all hover:-translate-y-1 shadow-lg shadow-cyan-500/25"
            >
              <ShoppingCart className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
                >
                  <div className="p-5 border-b border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${status.border} border`}
                      >
                        <StatusIcon
                          className={`w-4 h-4 ${status.color} ${
                            order.status === 'processing' ? 'animate-spin' : ''
                          }`}
                        />
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-900/50 flex-shrink-0">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {item.products?.title || 'Unknown Product'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} x ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-white font-medium">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Minecraft Username</p>
                        <p className="text-white font-medium">{order.minecraft_username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                          ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
