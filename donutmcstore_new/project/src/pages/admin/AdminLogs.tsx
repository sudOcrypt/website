import { useState, useEffect } from 'react';
import { Loader2, User, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LoginLog, User as UserType } from '../../types/database';

interface LogWithUser extends LoginLog {
  users: Pick<UserType, 'discord_username' | 'discord_avatar'>;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('login_logs')
        .select(`
          *,
          users (discord_username, discord_avatar)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as LogWithUser[]);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
        <h2 className="text-xl font-semibold text-white">Login History</h2>
        <span className="text-sm text-gray-500">Last 100 logins</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">No login history yet</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-gray-900/50">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">IP Address</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User Agent</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {log.users?.discord_avatar ? (
                          <img
                            src={log.users.discord_avatar}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-white">{log.users?.discord_username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 font-mono text-sm">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 text-sm truncate max-w-xs block">
                        {log.user_agent
                          ? log.user_agent.length > 50
                            ? log.user_agent.slice(0, 50) + '...'
                            : log.user_agent
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
