import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Save, Package, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types/database';

const categories = ['coins', 'items', 'bases'] as const;

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState('');

  const [form, setForm] = useState({
    category: 'coins' as Product['category'],
    title: '',
    description: '',
    image_url: '',
    price: '',
    original_price: '',
    stock: '',
    is_active: true,
    sort_order: '0',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromStripe = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSyncMessage('Please sign in again');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stripe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncMessage(data.message);
      await loadProducts();
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      category: 'coins',
      title: '',
      description: '',
      image_url: '',
      price: '',
      original_price: '',
      stock: '',
      is_active: true,
      sort_order: '0',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      category: product.category,
      title: product.title,
      description: product.description || '',
      image_url: product.image_url || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      stock: product.stock.toString(),
      is_active: product.is_active,
      sort_order: product.sort_order.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const productData = {
        category: form.category,
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock) || 0,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;
      }

      await loadProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const startEditingStock = (productId: string, currentStock: number) => {
    setEditingStockId(productId);
    setNewStockValue(currentStock.toString());
  };

  const cancelEditingStock = () => {
    setEditingStockId(null);
    setNewStockValue('');
  };

  const updateStock = async (productId: string) => {
    const newStock = parseInt(newStockValue);
    if (isNaN(newStock) || newStock < 0) {
      alert('Please enter a valid stock number');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-product-stock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            product_id: productId,
            new_stock: newStock,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
      );
      setSyncMessage(`✓ Stock updated successfully`);
      setTimeout(() => setSyncMessage(''), 3000);
      cancelEditingStock();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert(error instanceof Error ? error.message : 'Failed to update stock');
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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Products ({products.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={syncFromStripe}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 font-medium rounded-lg hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Stripe'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`mb-6 p-4 rounded-xl ${syncMessage.includes('Failed') || syncMessage.includes('error') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
          {syncMessage}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-sm text-blue-400">
          Products automatically sync when you add/edit them in Stripe. Use "Sync from Stripe" to manually refresh or for initial import.
          Add metadata in Stripe: <code className="bg-black/30 px-1 rounded">category</code> (coins/items/bases), <code className="bg-black/30 px-1 rounded">stock</code>, <code className="bg-black/30 px-1 rounded">sort_order</code>
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500 mb-4">No products yet.</p>
          <p className="text-gray-600 text-sm">Add products in Stripe or click "Sync from Stripe" to import.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-gray-800/50 rounded-xl border p-4 ${
                product.is_active ? 'border-white/10' : 'border-red-500/30 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900/50 flex-shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 capitalize">
                      {product.category}
                    </span>
                    {!product.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        Inactive
                      </span>
                    )}
                    {product.stripe_product_id && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        Stripe
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-white mt-1 truncate">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
                    {product.original_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.original_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Stock: {editingStockId === product.id ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={newStockValue}
                          onChange={(e) => setNewStockValue(e.target.value)}
                          className="w-16 px-2 py-0.5 bg-gray-900 border border-cyan-500/30 rounded text-white text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => updateStock(product.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                          title="Save"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditingStock}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startEditingStock(product.id, product.stock)}
                        className="hover:text-cyan-400 transition-colors"
                      >
                        {product.stock} <Edit2 className="w-3 h-3 inline ml-1" />
                      </button>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-800">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Original Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                    placeholder="For discounts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-gray-900/50 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Active (visible in shop)</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save
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
