import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Trophy, RefreshCw, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InviteClaim {
  id: string;
  user_id: string;
  discord_username: string;
  minecraft_username: string | null;
  invite_count: number;
  reward_amount: number;
  status: 'pending' | 'approved' | 'denied';
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  claimed_at: string;
}

interface InviteStats {
  inviter_id: string;
  inviter_username: string;
  valid_count: number;
  pending_count: number;
  total_count: number;
}

export function AdminInvites() {
  const [claims, setClaims] = useState<InviteClaim[]>([]);
  const [topInviters, setTopInviters] = useState<InviteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ claimId: string; notes: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadClaims(), loadTopInviters()]);
    setLoading(false);
  };

  const loadClaims = async () => {
    const { data, error } = await supabase
      .from('invite_claims')
      .select('*')
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error loading claims:', error);
    } else {
      setClaims(data || []);
    }
  };

  const loadTopInviters = async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('inviter_id, inviter_username, is_valid, left_server');

    if (error) {
      console.error('Error loading invites:', error);
      return;
    }

    const statsMap = new Map<string, InviteStats>();

    data?.forEach((invite) => {
      if (!statsMap.has(invite.inviter_id)) {
        statsMap.set(invite.inviter_id, {
          inviter_id: invite.inviter_id,
          inviter_username: invite.inviter_username,
          valid_count: 0,
          pending_count: 0,
          total_count: 0,
        });
      }

      const stats = statsMap.get(invite.inviter_id)!;
      if (!invite.left_server) {
        stats.total_count++;
        if (invite.is_valid) {
          stats.valid_count++;
        } else {
          stats.pending_count++;
        }
      }
    });

    const sorted = Array.from(statsMap.values())
      .sort((a, b) => b.valid_count - a.valid_count)
      .slice(0, 10);

    setTopInviters(sorted);
  };

  const handleClaim = async (claimId: string, action: 'approved' | 'denied', notes?: string) => {
    setProcessingId(claimId);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('invite_claims')
      .update({
        status: action,
        processed_by: user?.id || null,
        processed_at: new Date().toISOString(),
        admin_notes: notes || null,
      })
      .eq('id', claimId);

    if (error) {
      console.error('Error processing claim:', error);
      alert('Failed to process claim');
    } else {
      await loadClaims();
    }

    setProcessingId(null);
    setNoteModal(null);
  };

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const processedClaims = claims.filter(c => c.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
      case 'approved':
        return <span className="badge badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>;
      case 'denied':
        return <span className="badge badge-red flex items-center gap-1"><XCircle className="w-3 h-3" />Denied</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Invite Tracking</h1>
          <p className="text-gray-400">Manage invite rewards and view leaderboard</p>
        </div>
        <button
          onClick={loadData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Top Inviters</h2>
        </div>

        <div className="space-y-3">
          {topInviters.map((inviter, index) => (
            <div key={inviter.inviter_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-cyan-400">#{index + 1}</span>
                <div>
                  <p className="font-medium text-white">{inviter.inviter_username}</p>
                  <p className="text-sm text-gray-400">
                    {inviter.valid_count} valid • {inviter.pending_count} pending • {inviter.total_count} total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-400">{(inviter.valid_count * 250000).toLocaleString()} coins</p>
                <p className="text-xs text-gray-500">earned</p>
              </div>
            </div>
          ))}
          {topInviters.length === 0 && (
            <p className="text-gray-500 text-center py-8">No invites yet</p>
          )}
        </div>
      </div>

      {pendingClaims.length > 0 && (
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-yellow-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Pending Claims ({pendingClaims.length})</h2>
          </div>

          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="glass p-6 rounded-xl border-2 border-yellow-500/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">{claim.discord_username}</h3>
                      {getStatusBadge(claim.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Minecraft Username</p>
                        <p className="font-medium text-cyan-400">{claim.minecraft_username || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valid Invites</p>
                        <p className="font-medium text-white">{claim.invite_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reward Amount</p>
                        <p className="font-medium text-green-400">{claim.reward_amount.toLocaleString()} coins</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Claimed At</p>
                        <p className="font-medium text-gray-400">{new Date(claim.claimed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleClaim(claim.id, 'approved')}
                    disabled={processingId === claim.id}
                    className="btn-primary flex items-center gap-2 flex-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setNoteModal({ claimId: claim.id, notes: '' })}
                    disabled={processingId === claim.id}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Add Note & Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Claim History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-3 text-gray-400 font-medium">User</th>
                <th className="pb-3 text-gray-400 font-medium">Minecraft</th>
                <th className="pb-3 text-gray-400 font-medium">Invites</th>
                <th className="pb-3 text-gray-400 font-medium">Reward</th>
                <th className="pb-3 text-gray-400 font-medium">Status</th>
                <th className="pb-3 text-gray-400 font-medium">Date</th>
                <th className="pb-3 text-gray-400 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {processedClaims.map((claim) => (
                <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 text-white">{claim.discord_username}</td>
                  <td className="py-4 text-gray-400">{claim.minecraft_username || '-'}</td>
                  <td className="py-4 text-white">{claim.invite_count}</td>
                  <td className="py-4 text-green-400">{claim.reward_amount.toLocaleString()}</td>
                  <td className="py-4">{getStatusBadge(claim.status)}</td>
                  <td className="py-4 text-gray-400">{new Date(claim.claimed_at).toLocaleDateString()}</td>
                  <td className="py-4 text-gray-400">{claim.admin_notes || '-'}</td>
                </tr>
              ))}
              {processedClaims.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No processed claims yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add Note & Deny Claim</h3>
            <textarea
              value={noteModal.notes}
              onChange={(e) => setNoteModal({ ...noteModal, notes: e.target.value })}
              placeholder="Reason for denial..."
              className="input-field w-full h-32 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleClaim(noteModal.claimId, 'denied', noteModal.notes)}
                className="btn-primary flex-1"
              >
                Deny with Note
              </button>
              <button
                onClick={() => setNoteModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
