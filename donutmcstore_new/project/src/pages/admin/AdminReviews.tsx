import { useState, useEffect } from 'react';
import { Loader2, Star, Check, X, Trash2, MessageSquare, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Review, User as UserType, Order } from '../../types/database';

interface ReviewWithDetails extends Review {
  users: Pick<UserType, 'discord_username' | 'discord_avatar' | 'discord_id'>;
  orders: Pick<Order, 'id' | 'total_amount' | 'created_at'> | null;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (discord_username, discord_avatar, discord_id),
          orders (id, total_amount, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as ReviewWithDetails[]);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: true } : r))
      );
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const rejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: false } : r))
      );
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-cyan-400 text-cyan-400' : 'fill-gray-700 text-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.is_approved;
    if (filter === 'approved') return review.is_approved;
    return true;
  });

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
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              filter === f
                ? f === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-800/50 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            {f} ({reviews.filter((r) => {
              if (f === 'pending') return !r.is_approved;
              if (f === 'approved') return r.is_approved;
              return true;
            }).length})
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-white/10">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-gray-800/50 rounded-xl border p-5 ${
                review.is_approved ? 'border-green-500/20' : 'border-yellow-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {review.users?.discord_avatar ? (
                      <img
                        src={review.users.discord_avatar}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">
                        {review.users?.discord_username || 'Unknown User'}
                      </span>
                      {renderStars(review.rating)}
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          review.is_approved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-3">{review.content}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Discord: {review.users?.discord_id}</span>
                      {review.orders && (
                        <span>
                          Order: #{review.orders.id.slice(0, 8).toUpperCase()} ($
                          {review.orders.total_amount})
                        </span>
                      )}
                      <span>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!review.is_approved && (
                    <button
                      onClick={() => approveReview(review.id)}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      onClick={() => rejectReview(review.id)}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                      title="Unapprove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
