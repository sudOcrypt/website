import { useState, useEffect } from 'react';
import { Upload, Download, Search, Loader2, FileBox, Eye, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { AuthModal } from '../components/AuthModal';
import type { Schematic, User as UserType } from '../types/database';

interface SchematicWithUser extends Schematic {
  users: Pick<UserType, 'discord_username' | 'discord_avatar'>;
}

export function SchematicsPage() {
  const [schematics, setSchematics] = useState<SchematicWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    isAnonymous: false,
  });
  const [schematicFile, setSchematicFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchematics((data || []) as SchematicWithUser[]);
    } catch (error) {
      console.error('Error loading schematics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.litematic')) {
        setUploadError('Only .litematic files are allowed');
        return;
      }
      setSchematicFile(file);
      setUploadError('');
    }
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Only PNG, JPG, WebP, or GIF images are allowed');
        return;
      }
      setPreviewImage(file);
      setUploadError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !schematicFile) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const timestamp = Date.now();
      const schematicPath = `${user.id}/${timestamp}_${schematicFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('schematics')
        .upload(schematicPath, schematicFile);

      if (uploadError) throw uploadError;

      let previewPath = null;
      if (previewImage) {
        previewPath = `${user.id}/${timestamp}_preview_${previewImage.name}`;
        const { error: previewError } = await supabase.storage
          .from('schematics')
          .upload(previewPath, previewImage);

        if (previewError) throw previewError;
      }

      const { error: insertError } = await supabase.from('schematics').insert({
        user_id: user.id,
        title: uploadForm.title,
        description: uploadForm.description || null,
        file_path: schematicPath,
        preview_image_path: previewPath,
        is_anonymous: uploadForm.isAnonymous,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setIsUploadOpen(false);
      setUploadForm({ title: '', description: '', isAnonymous: false });
      setSchematicFile(null);
      setPreviewImage(null);
      alert('Schematic submitted for review!');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload schematic. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (schematic: SchematicWithUser) => {
    try {
      const { data, error } = await supabase.storage
        .from('schematics')
        .createSignedUrl(schematic.file_path, 60);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');

      await supabase
        .from('schematics')
        .update({ download_count: schematic.download_count + 1 })
        .eq('id', schematic.id);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const filteredSchematics = schematics.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative pt-24 pb-16">
      <section className="relative py-12">

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Community Schematics
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Share and download Litematica builds from the DonutSMP community
          </p>

          <button
            onClick={handleUploadClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
          >
            <Upload className="w-5 h-5" />
            Upload Schematic
          </button>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search schematics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : filteredSchematics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchematics.map((schematic) => (
                <div
                  key={schematic.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-cyan-500/50 transition-all group"
                >
                  <div className="aspect-video bg-gray-900/50 relative overflow-hidden">
                    {schematic.preview_image_path ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/schematics/${schematic.preview_image_path}`}
                        alt={schematic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileBox className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                      {schematic.title}
                    </h3>

                    {schematic.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {schematic.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {!schematic.is_anonymous && schematic.users?.discord_avatar ? (
                          <img
                            src={schematic.users.discord_avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm text-gray-400">
                          {schematic.is_anonymous
                            ? 'Anonymous'
                            : schematic.users?.discord_username || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        {schematic.download_count}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(schematic)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-700/50 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-400 font-medium rounded-lg transition-all border border-transparent hover:border-cyan-500/50"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
                <FileBox className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Schematics Found</h3>
              <p className="text-gray-500">Be the first to share a build!</p>
            </div>
          )}
        </div>
      </section>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsUploadOpen(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Upload Schematic</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="Build name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Describe your build..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Schematic File (.litematic) *
                </label>
                <input
                  type="file"
                  required
                  accept=".litematic"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preview Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePreviewChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 file:cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadForm.isAnonymous}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, isAnonymous: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-white/20 bg-gray-900/50 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Submit anonymously</span>
              </label>

              {uploadError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {uploadError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !schematicFile}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Submit
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-gray-500 text-xs">
                Uploads are reviewed before appearing publicly
              </p>
            </form>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        message="You need to sign in with Discord to upload schematics."
      />
    </div>
  );
}
