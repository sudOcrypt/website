export function ProductSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
          <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl w-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
          <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="h-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full w-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
            </div>
            <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10 flex justify-between">
        <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
          <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-5/6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
        <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg w-4/6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-shimmer" />
          </div>
        </td>
      ))}
    </tr>
  );
}
