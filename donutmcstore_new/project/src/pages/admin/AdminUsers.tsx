import { useState, useEffect } from 'react';
import { Loader2, Ban, UserX, Shield, Search, X, Plus, Trash2, Globe, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User, Ban as BanType } from '../../types/database';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [bans, setBans] = useState<BanType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'bans'>('users');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({
    ban_type: 'discord_id' as BanType['ban_type'],
    ban_value: '',
    reason: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResult, bansResult] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('bans').select('*').order('created_at', { ascending: false }),
      ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (bansResult.data) setBans(bansResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (user: User) => {
    setBanForm({
      ban_type: 'discord_id',
      ban_value: user.discord_id,
      reason: '',
    });
    setIsBanModalOpen(true);
  };

  const handleSubmitBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: currentUser } = await supabase.auth.getUser();

      const { error } = await supabase.from('bans').insert({
        ban_type: banForm.ban_type,
        ban_value: banForm.ban_value,
        reason: banForm.reason || null,
        banned_by: currentUser.user?.id,
      });

      if (error) throw error;

      await loadData();
      setIsBanModalOpen(false);
      setBanForm({ ban_type: 'discord_id', ban_value: '', reason: '' });
    } catch (error) {
      console.error('Error creating ban:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBan = async (banId: string) => {
    if (!confirm('Are you sure you want to remove this ban?')) return;

    try {
      const { error } = await supabase.from('bans').delete().eq('id', banId);
      if (error) throw error;
      setBans((prev) => prev.filter((b) => b.id !== banId));
    } catch (error) {
      console.error('Error removing ban:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.discord_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.discord_id.includes(searchTerm)
  );

  const getBanTypeIcon = (type: BanType['ban_type']) => {
    switch (type) {
      case 'discord_id':
        return <UserIcon className="w-4 h-4" />;
      case 'user_id':
        return <Shield className="w-4 h-4" />;
      case 'ip_address':
        return <Globe className="w-4 h-4" />;
    }
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
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('bans')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'bans'
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
          }`}
        >
          Bans ({bans.length})
        </button>
        <button
          onClick={() => setIsBanModalOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-medium hover:bg-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Ban
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search users by username or Discord ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gray-900/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Discord ID</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Joined</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.discord_avatar ? (
                            <img
                              src={user.discord_avatar}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-white font-medium">{user.discord_username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 font-mono text-sm">{user.discord_id}</td>
                      <td className="py-4 px-4">
                        {user.is_admin ? (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg">Admin</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-lg">User</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        {!user.is_admin && (
                          <button
                            onClick={() => handleBanUser(user)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Ban User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bans' && (
        <div className="space-y-4">
          {bans.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
              <Ban className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">No active bans</p>
            </div>
          ) : (
            bans.map((ban) => (
              <div
                key={ban.id}
                className="bg-gray-800/50 rounded-xl border border-red-500/20 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                    {getBanTypeIcon(ban.ban_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 capitalize">
                        {ban.ban_type.replace('_', ' ')}
                      </span>
                      <span className="text-white font-mono">{ban.ban_value}</span>
                    </div>
                    {ban.reason && (
                      <p className="text-sm text-gray-400 mt-1">Reason: {ban.reason}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Banned on {new Date(ban.created_at).toLocaleDateString()}
                      {ban.expires_at && ` - Expires ${new Date(ban.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBan(ban.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isBanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsBanModalOpen(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setIsBanModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Ban</h2>
                <p className="text-sm text-gray-400">Block access to the site</p>
              </div>
            </div>

            <form onSubmit={handleSubmitBan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ban Type</label>
                <select
                  value={banForm.ban_type}
                  onChange={(e) => setBanForm({ ...banForm, ban_type: e.target.value as BanType['ban_type'] })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                >
                  <option value="discord_id" className="bg-gray-800">Discord ID</option>
                  <option value="user_id" className="bg-gray-800">User Account</option>
                  <option value="ip_address" className="bg-gray-800">IP Address</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {banForm.ban_type === 'discord_id' && 'Discord User ID'}
                  {banForm.ban_type === 'user_id' && 'User Account ID'}
                  {banForm.ban_type === 'ip_address' && 'IP Address'}
                </label>
                <input
                  type="text"
                  required
                  value={banForm.ban_value}
                  onChange={(e) => setBanForm({ ...banForm, ban_value: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  placeholder={
                    banForm.ban_type === 'discord_id'
                      ? '123456789012345678'
                      : banForm.ban_type === 'ip_address'
                      ? '192.168.1.1'
                      : 'uuid...'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none"
                  placeholder="Why is this user being banned?"
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-red-400">
                  This will completely block the user from accessing the site. They will not be able to view pages, login, or browse.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBanModalOpen(false)}
                  className="flex-1 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Add Ban
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
