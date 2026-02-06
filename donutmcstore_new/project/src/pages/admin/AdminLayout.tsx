import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Package, ShoppingCart, History, FileBox, BarChart3, Loader2, Shield, Users, Star, Bell, Megaphone } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const adminTabs = [
  { path: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/schematics', label: 'Schematics', icon: FileBox },
  { path: '/admin/banners', label: 'Banners', icon: Megaphone },
  { path: '/admin/notifications', label: 'Alerts', icon: Bell },
  { path: '/admin/logs', label: 'Logs', icon: History },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, isLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVerifying(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || isVerifying) {
    return (
      <div className="relative pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin relative" />
          </div>
          <p className="text-gray-400 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative pt-24 pb-16">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage your store and monitor activity</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass px-4 py-2 rounded-xl">
              <div className="flex items-center gap-3">
                {user.discord_avatar && (
                  <img src={user.discord_avatar} alt="" className="w-8 h-8 rounded-lg" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{user.discord_username}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-400">Administrator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="glass rounded-2xl p-2 inline-flex flex-wrap gap-2">
            {adminTabs.map((tab) => {
              const isActive = tab.exact
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path) && tab.path !== '/admin';

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-xl" />
                    </>
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
                  )}
                  <tab.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
