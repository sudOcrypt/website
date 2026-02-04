import { useState, useEffect } from 'react';
import { Loader2, Eye, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, Product, User } from '../../types/database';

interface OrderWithDetails extends Order {
  users: Pick<User, 'discord_username' | 'discord_avatar'>;
  order_items: (OrderItem & { products: Product })[];
}

const statusOptions = ['pending', 'processing', 'completed', 'cancelled', 'refunded'] as const;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  completed: 'bg-green-500/20 text-green-400 border-green-500/50',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
  refunded: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (discord_username, discord_avatar),
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as OrderWithDetails[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus as Order['status'] }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] });
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', ...statusOptions].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-gray-900/50">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Order ID</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Customer</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">MC Username</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-gray-300 font-mono text-sm">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {order.users?.discord_avatar && (
                          <img
                            src={order.users.discord_avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-white">{order.users?.discord_username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">{order.minecraft_username}</td>
                    <td className="py-4 px-4 text-white font-medium">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border bg-transparent cursor-pointer ${statusColors[order.status]}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status} className="bg-gray-800 text-white">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="text-white">{selectedOrder.users?.discord_username || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MC Username</p>
                  <p className="text-white">{selectedOrder.minecraft_username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className={`mt-1 px-3 py-1.5 rounded-lg text-sm font-medium border bg-transparent ${statusColors[selectedOrder.status]}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-gray-800 text-white">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-white">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-3">Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white">{item.products?.title || 'Unknown'}</p>
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
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <p className="text-lg font-semibold text-white">Total</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  ${selectedOrder.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
