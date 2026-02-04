import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Eye, FileBox, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Schematic, User as UserType } from '../../types/database';

interface SchematicWithUser extends Schematic {
  users: Pick<UserType, 'discord_username' | 'discord_avatar'>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  approved: 'bg-green-500/20 text-green-400 border-green-500/50',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export function AdminSchematics() {
  const [schematics, setSchematics] = useState<SchematicWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadSchematics();
  }, []);

  const loadSchematics = async () => {
    try {
      const { data, error } = await supabase
        .from('schematics')
        .select(`
          *,
          users (discord_username, discord_avatar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchematics((data || []) as SchematicWithUser[]);
    } catch (error) {
      console.error('Error loading schematics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('schematics')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSchematics((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch (error) {
      console.error('Error updating schematic:', error);
    }
  };

  const deleteSchematic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schematic?')) return;

    try {
      const { error } = await supabase.from('schematics').delete().eq('id', id);

      if (error) throw error;
      setSchematics((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting schematic:', error);
    }
  };

  const filteredSchematics =
    filter === 'all' ? schematics : schematics.filter((s) => s.status === filter);

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
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
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
            {status === 'pending' && (
              <span className="ml-2 text-xs">
                ({schematics.filter((s) => s.status === 'pending').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredSchematics.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <FileBox className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">No schematics found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchematics.map((schematic) => (
            <div
              key={schematic.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="aspect-video bg-gray-900/50 relative">
                {schematic.preview_image_path ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/schematics/${schematic.preview_image_path}`}
                    alt={schematic.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileBox className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[schematic.status]}`}
                >
                  {schematic.status}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate">{schematic.title}</h3>

                {schematic.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{schematic.description}</p>
                )}

                <div className="flex items-center gap-2 mb-3 text-sm">
                  {!schematic.is_anonymous && schematic.users?.discord_avatar ? (
                    <img
                      src={schematic.users.discord_avatar}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <span className="text-gray-400">
                    {schematic.is_anonymous
                      ? 'Anonymous'
                      : schematic.users?.discord_username || 'Unknown'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {schematic.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(schematic.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(schematic.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {schematic.status !== 'pending' && (
                    <button
                      onClick={() => deleteSchematic(schematic.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
