import { Coins, Package, Castle } from 'lucide-react';

type Category = 'all' | 'coins' | 'items' | 'bases';

interface CategoryTabsProps {
  activeCategory: Category;
  onChange: (category: Category) => void;
}

const categories = [
  { id: 'all' as const, label: 'All Items', icon: null },
  { id: 'coins' as const, label: 'Coins', icon: Coins },
  { id: 'items' as const, label: 'Items', icon: Package },
  { id: 'bases' as const, label: 'Bases', icon: Castle },
];

export function CategoryTabs({ activeCategory, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-white/10'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
