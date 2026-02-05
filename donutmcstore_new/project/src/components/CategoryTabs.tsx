import { Coins, Package, Castle, Sword, Shield, Crown, Star, Zap, Box, LucideIcon } from 'lucide-react';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
}

// Icon mapping for common categories
const categoryIcons: Record<string, LucideIcon> = {
  coins: Coins,
  items: Package,
  bases: Castle,
  weapons: Sword,
  armor: Shield,
  ranks: Crown,
  kits: Star,
  perks: Zap,
  crates: Box,
};

// Capitalize first letter of each word
const formatCategoryName = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function CategoryTabs({ categories, activeCategory, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {/* Always show "All Items" first */}
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
          activeCategory === 'all'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
            : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-white/10'
        }`}
      >
        All Items
      </button>

      {/* Dynamically render categories from products */}
      {categories
        .filter(cat => cat !== 'all')
        .map((category) => {
          const Icon = categoryIcons[category.toLowerCase()] || Package; // Default to Package icon
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              onClick={() => onChange(category)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {formatCategoryName(category)}
            </button>
          );
        })}
    </div>
  );
}
