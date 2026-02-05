import { useState, useEffect } from 'react';
import { Sparkles, Shield, Clock, Zap, ArrowRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/database';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);

      // Extract unique categories from products
      const uniqueCategories = Array.from(
        new Set(data?.map(p => p.category).filter(Boolean) || [])
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = category === 'all'
    ? products
    : products.filter((p) => p.category === category);

  const features = [
    {
      icon: Shield,
      title: 'Secure Trading',
      description: 'All transactions are protected and verified',
    },
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Items delivered within 24 hours',
    },
    {
      icon: Sparkles,
      title: 'Premium Quality',
      description: 'Only the best items from DonutSMP',
    },
    {
      icon: Zap,
      title: 'Instant Support',
      description: '24/7 Discord support available',
    },
  ];

  return (
    <div className="relative">
      <section className="relative pt-32 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 glass rounded-full border border-cyan-500/30 animate-border-glow">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-sm text-cyan-400 font-medium">DonutSMP Official Marketplace</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up stagger-1">
            <span className="block mb-2 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Trade Premium
            </span>
            <span className="relative inline-block">
              <span className="gradient-text-animated text-glow">Minecraft Items</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2 leading-relaxed">
            Buy and sell coins, items, and bases on DonutSMP.
            <span className="text-cyan-400"> Fast, secure, </span>
            and trusted by the community.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up stagger-3">
            <a
              href="#shop"
              className="btn-shimmer group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:-translate-y-1"
            >
              <span className="relative flex items-center gap-2">
                Browse Shop
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a
              href="https://discord.gg/rtP5YhJFRB"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 py-4 glass rounded-2xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30"
            >
              <span className="relative flex items-center gap-2 text-white">
                <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Join Discord
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="relative py-12">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-5 md:p-6 glass rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30 card-tilt animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative w-12 h-12 md:w-14 md:h-14 mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white relative" />
                </div>

                <h3 className="relative font-semibold text-white text-base md:text-lg mb-1 md:mb-2 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="relative text-xs md:text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="shop" className="relative py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass rounded-full">
              <span className="text-sm text-gray-400">Premium Collection</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="gradient-text">Shop</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Browse our curated collection of premium DonutSMP items
            </p>
          </div>

          <div className="mb-12">
            <CategoryTabs 
              categories={categories} 
              activeCategory={category} 
              onChange={setCategory} 
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-800/50 to-gray-900/50 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-700/50 rounded w-1/4 animate-pulse" />
                    <div className="h-6 bg-gray-700/50 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse" />
                    <div className="h-12 bg-gray-700/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl" />
                <div className="relative w-full h-full glass rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-cyan-500" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Products Yet</h3>
              <p className="text-gray-400 mb-6">Check back soon for new items!</p>
              <a
                href="https://discord.gg/rtP5YhJFRB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 glass rounded-xl text-cyan-400 hover:text-white hover:border-cyan-500/30 transition-all"
              >
                Get notified on Discord
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="relative py-20">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join thousands of players already trading on DonutMC Store
          </p>
          <a
            href="https://discord.gg/rtP5YhJFRB"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-discord inline-flex"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join Our Discord
          </a>
        </div>
      </section>
    </div>
  );
}
