import { useState, useEffect } from 'react';
import { Loader2, User, Clock, Globe, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LoginLog, User as UserType } from '../../types/database';

interface LogWithUser extends LoginLog {
  users: Pick<UserType, 'discord_username' | 'discord_avatar'>;
}

interface ConsolidatedLog {
  user_id: string;
  username: string;
  avatar: string | null;
  login_count: number;
  last_login: string;
  last_ip: string | null;
  last_user_agent: string | null;
  unique_ips: string[];
  has_vpn_warning: boolean;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [consolidatedLogs, setConsolidatedLogs] = useState<ConsolidatedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'consolidated' | 'detailed'>('consolidated');

  useEffect(() => {
    loadLogs();

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadLogs();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        .limit(500);

      if (error) throw error;
      const logsData = (data || []) as LogWithUser[];
      setLogs(logsData);
      
      // Consolidate logs by user
      const userLogsMap = new Map<string, ConsolidatedLog>();
      logsData.forEach(log => {
        const userId = log.user_id;
        if (!userLogsMap.has(userId)) {
          const uniqueIps = log.ip_address ? [log.ip_address] : [];
          userLogsMap.set(userId, {
            user_id: userId,
            username: log.users?.discord_username || 'Unknown',
            avatar: log.users?.discord_avatar || null,
            login_count: 1,
            last_login: log.created_at,
            last_ip: log.ip_address,
            last_user_agent: log.user_agent,
            unique_ips: uniqueIps,
            has_vpn_warning: log.is_vpn_suspected || false,
          });
        } else {
            const existing = userLogsMap.get(userId)!;
            existing.login_count++;
            // Track unique IPs
            if (log.ip_address && !existing.unique_ips.includes(log.ip_address)) {
              existing.unique_ips.push(log.ip_address);
            }
            // Check for VPN detection from database
            if (log.is_vpn_suspected) {
              existing.has_vpn_warning = true;
            }
        }
      });
      
      setConsolidatedLogs(Array.from(userLogsMap.values()).sort((a, b) => 
        new Date(b.last_login).getTime() - new Date(a.last_login).getTime()
      ));
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
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('consolidated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'consolidated'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              By User
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'detailed'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              All Logins
            </button>
          </div>
          <button
            onClick={() => loadLogs()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-400 border border-white/10 rounded-lg text-sm font-medium hover:text-white hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span className="text-sm text-gray-500">
            {viewMode === 'consolidated' 
              ? `${consolidatedLogs.length} unique users` 
              : `Last ${logs.length} logins`}
          </span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">No login history yet</p>
        </div>
      ) : viewMode === 'consolidated' ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-gray-900/50">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Total Logins</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Last IP</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedLogs.map((log) => (
                  <tr key={log.user_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {log.avatar ? (
                          <img
                            src={log.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-white">{log.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        {log.login_count} {log.login_count === 1 ? 'time' : 'times'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {log.last_ip ? (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400 font-mono text-sm">{log.last_ip}</span>
                            {log.unique_ips.length > 1 && (
                              <span 
                                className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30"
                                title={`Used ${log.unique_ips.length} different IPs: ${log.unique_ips.join(', ')}`}
                              >
                                {log.unique_ips.length} IPs
                              </span>
                            )}
                            {log.has_vpn_warning && (
                              <AlertTriangle 
                                className="w-4 h-4 text-orange-400" 
                                title="VPN/Proxy usage detected via ISP analysis"
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm italic">Not captured</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm whitespace-nowrap">
                      {formatDate(log.last_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <td className="py-4 px-4">
                      {log.ip_address ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-mono text-sm">{log.ip_address}</span>
                          {log.is_vpn_suspected && (
                            <span 
                              className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30 flex items-center gap-1"
                              title={log.isp_org ? `VPN/Proxy detected: ${log.isp_org}` : 'VPN/Proxy detected'}
                            >
                              <Shield className="w-3 h-3" />
                              VPN
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 italic text-sm">Not captured</span>
                      )}
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
