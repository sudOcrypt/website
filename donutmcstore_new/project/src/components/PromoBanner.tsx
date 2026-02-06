import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Banner } from '../types/database';

export function PromoBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBanners();
    const interval = setInterval(loadBanners, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const activeBanners = (data || []).filter((banner) => {
        const startOk = !banner.start_date || new Date(banner.start_date) <= now;
        const endOk = !banner.end_date || new Date(banner.end_date) > now;
        return startOk && endOk && !dismissed.has(banner.id);
      });

      setBanners(activeBanners);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  };

  const dismissBanner = (bannerId: string) => {
    setDismissed((prev) => new Set([...prev, bannerId]));
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
  };

  if (banners.length === 0 || !isVisible) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className={`relative bg-gradient-to-r ${currentBanner.background_color} py-3 px-4`}>
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 text-white flex-shrink-0 animate-pulse" />
            <p className="text-white font-medium text-sm md:text-base text-center flex-1 animate-fade-in">
              {currentBanner.message}
            </p>
          </div>

          {banners.length > 1 && (
            <div className="flex gap-1.5 flex-shrink-0">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => dismissBanner(currentBanner.id)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
