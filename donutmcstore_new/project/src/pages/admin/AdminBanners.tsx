import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Calendar, Eye, EyeOff, Palette, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Banner } from '../../types/database';

const gradientOptions = [
  { label: 'Cyan → Blue', value: 'from-cyan-500 to-blue-600' },
  { label: 'Yellow → Orange', value: 'from-yellow-500 to-orange-600' },
  { label: 'Green → Emerald', value: 'from-green-500 to-emerald-600' },
  { label: 'Purple → Pink', value: 'from-purple-500 to-pink-600' },
  { label: 'Red → Orange', value: 'from-red-500 to-orange-600' },
  { label: 'Blue → Purple', value: 'from-blue-500 to-purple-600' },
  { label: 'Teal → Cyan', value: 'from-teal-500 to-cyan-600' },
  { label: 'Indigo → Blue', value: 'from-indigo-500 to-blue-600' },
];

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    is_active: true,
    start_date: '',
    end_date: '',
    display_order: 0,
    background_color: 'from-cyan-500 to-blue-600',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('banners')
          .update({
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert({
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          });

        if (error) throw error;
      }

      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      message: banner.message,
      is_active: banner.is_active,
      start_date: banner.start_date ? new Date(banner.start_date).toISOString().slice(0, 16) : '',
      end_date: banner.end_date ? new Date(banner.end_date).toISOString().slice(0, 16) : '',
      display_order: banner.display_order,
      background_color: banner.background_color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      loadBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
    }
  };

  const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? banner.display_order - 1 : banner.display_order + 1;
    
    try {
      const { error } = await supabase
        .from('banners')
        .update({ display_order: newOrder })
        .eq('id', banner.id);

      if (error) throw error;
      loadBanners();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      message: '',
      is_active: true,
      start_date: '',
      end_date: '',
      display_order: banners.length,
      background_color: 'from-cyan-500 to-blue-600',
    });
    setEditingId(null);
    setShowForm(false);
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
          <h1 className="text-3xl font-bold gradient-text mb-2">Banner Management</h1>
          <p className="text-gray-400">Create and manage rotating promotional banners</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBanners}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{showForm ? 'Cancel' : 'New Banner'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-2xl animate-scale-in">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Banner' : 'Create New Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Message
              </label>
              <input
                type="text"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="input-field"
                placeholder="🎉 Your promotional message here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Background Gradient
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {gradientOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, background_color: option.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.background_color === option.value
                        ? 'border-cyan-500'
                        : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <div className={`h-8 rounded bg-gradient-to-r ${option.value} mb-1`} />
                    <p className="text-xs text-gray-400">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-700 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">Display Order:</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="input-field w-20"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center">
          <p className="text-gray-400 mb-4">No banners created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const now = new Date();
            const isScheduled = banner.start_date && new Date(banner.start_date) > now;
            const isExpired = banner.end_date && new Date(banner.end_date) < now;
            const isCurrentlyActive = banner.is_active && !isScheduled && !isExpired;

            return (
              <div key={banner.id} className="glass p-4 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${banner.background_color} mb-2`}>
                      <p className="text-white font-medium">{banner.message}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      {banner.start_date && (
                        <span>Starts: {new Date(banner.start_date).toLocaleString()}</span>
                      )}
                      {banner.end_date && (
                        <span>Ends: {new Date(banner.end_date).toLocaleString()}</span>
                      )}
                      {!banner.start_date && !banner.end_date && (
                        <span>No time restrictions</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      {isCurrentlyActive && (
                        <span className="badge badge-green">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" />
                          Active Now
                        </span>
                      )}
                      {isScheduled && (
                        <span className="badge badge-yellow">Scheduled</span>
                      )}
                      {isExpired && (
                        <span className="badge badge-red">Expired</span>
                      )}
                      {!banner.is_active && (
                        <span className="badge badge-red">Disabled</span>
                      )}
                      <span className="badge badge-cyan">Order: {banner.display_order}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleActive(banner)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title={banner.is_active ? 'Disable' : 'Enable'}
                    >
                      {banner.is_active ? (
                        <Eye className="w-4 h-4 text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    <button
                      onClick={() => moveOrder(banner, 'up')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Move up"
                      disabled={banner.display_order === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => moveOrder(banner, 'down')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>

                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
