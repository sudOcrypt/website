import { useState, useEffect } from 'react';
import { Loader2, Bell, Check, Trash2, ShoppingCart, FileBox, Star, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { AdminNotification } from '../../types/database';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;

    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .in('id', notifications.map((n) => n.id));

      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'new_schematic':
        return <FileBox className="w-5 h-5" />;
      case 'new_review':
        return <Star className="w-5 h-5" />;
      case 'payment_failed':
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_order':
        return 'bg-green-500/20 text-green-400';
      case 'new_schematic':
        return 'bg-blue-500/20 text-blue-400';
      case 'new_review':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'payment_failed':
        return 'bg-red-500/20 text-red-400';
    }
  };

  const getLink = (notification: AdminNotification) => {
    switch (notification.type) {
      case 'new_order':
      case 'payment_failed':
        return '/admin/orders';
      case 'new_schematic':
        return '/admin/schematics';
      case 'new_review':
        return '/admin/reviews';
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-lg">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:text-white hover:bg-gray-700/50 transition-all"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const link = getLink(notification);
            const content = (
              <div
                className={`bg-gray-800/50 rounded-xl border p-4 flex items-start gap-4 transition-all ${
                  notification.is_read
                    ? 'border-white/5 opacity-60'
                    : 'border-cyan-500/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                    )}
                  </div>
                  {notification.message && (
                    <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );

            return link ? (
              <Link key={notification.id} to={link} onClick={() => markAsRead(notification.id)}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
