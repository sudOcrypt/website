import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp, Loader2, ArrowUpRight, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  recentOrders: {
    id: string;
    minecraft_username: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ordersRes, usersRes, recentRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('id, minecraft_username, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const orders = ordersRes.data || [];
      const completedOrders = orders.filter((o) => o.status === 'completed');
      const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing');

      setStats({
        totalRevenue: completedOrders.reduce((sum, o) => sum + o.total_amount, 0),
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalUsers: usersRes.count || 0,
        recentOrders: recentRes.data || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin relative" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      bgGlow: 'bg-green-500/20',
      change: '+12.5%',
      positive: true,
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-cyan-500 to-blue-600',
      bgGlow: 'bg-cyan-500/20',
      change: '+8.2%',
      positive: true,
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-600',
      bgGlow: 'bg-yellow-500/20',
      change: stats.pendingOrders > 0 ? 'Needs attention' : 'All clear',
      positive: stats.pendingOrders === 0,
    },
    {
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      gradient: 'from-cyan-400 to-blue-500',
      bgGlow: 'bg-cyan-400/20',
      change: '+15.3%',
      positive: true,
    },
  ];

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className={`absolute inset-0 ${stat.bgGlow} rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`} />
                  <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                    <stat.icon className="w-7 h-7 text-white relative" />
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {stat.positive && <TrendingUp className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <p className="text-sm text-gray-500">Latest transactions</p>
              </div>
            </div>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                <div className="relative w-full h-full glass rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-600 mt-1">Orders will appear here once customers make purchases</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-gray-900/30 hover:bg-gray-900/50 border border-white/5 hover:border-cyan-500/20 transition-all"
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-mono text-gray-300">
                      #{order.id.slice(0, 4)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{order.minecraft_username}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border ${
                        statusColors[order.status]?.bg
                      } ${statusColors[order.status]?.text} ${statusColors[order.status]?.border}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-white font-semibold min-w-[80px] text-right">
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>

          <div className="space-y-3">
            <Link
              to="/admin/products"
              className="group flex items-center gap-4 p-4 rounded-xl bg-gray-900/30 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">Add New Product</p>
                <p className="text-sm text-gray-500">Create a new listing</p>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="group flex items-center gap-4 p-4 rounded-xl bg-gray-900/30 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">Manage Orders</p>
                <p className="text-sm text-gray-500">{stats.pendingOrders} pending</p>
              </div>
            </Link>

            <Link
              to="/admin/schematics"
              className="group flex items-center gap-4 p-4 rounded-xl bg-gray-900/30 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">Review Schematics</p>
                <p className="text-sm text-gray-500">Check pending uploads</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
