import { useState, useEffect } from 'react';
import { Star, User, Quote, Loader2, MessageSquare, ArrowRight, PenSquare, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Review, User as UserType, Order } from '../types/database';

interface ReviewWithUser extends Review {
  users: Pick<UserType, 'discord_username' | 'discord_avatar'>;
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, average: 0 });
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isCustomer, setIsCustomer] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: '',
    order_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (user) {
      checkCustomerStatus();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (discord_username, discord_avatar)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = (data || []) as ReviewWithUser[];
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setStats({ total: reviewsData.length, average: Math.round(avg * 10) / 10 });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCustomerStatus = async () => {
    if (!user) return;

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const completedOrdersList = orders || [];
      setCompletedOrders(completedOrdersList);
      setIsCustomer(completedOrdersList.length > 0);

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasReviewed(!!existingReview);
    } catch (error) {
      console.error('Error checking customer status:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        rating: reviewForm.rating,
        content: reviewForm.content,
        order_id: reviewForm.order_id || null,
        is_approved: false,
      });

      if (error) throw error;

      await supabase.from('admin_notifications').insert({
        type: 'new_review',
        title: 'New Review Submitted',
        message: `${user.discord_username} submitted a ${reviewForm.rating}-star review`,
      });

      setIsWriteModalOpen(false);
      setReviewForm({ rating: 5, content: '', order_id: '' });
      setHasReviewed(true);
      alert('Thank you! Your review has been submitted and is pending approval.');
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= rating
                  ? 'fill-cyan-400 text-cyan-400'
                  : 'fill-gray-700 text-gray-700'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canWriteReview = isAuthenticated && isCustomer && !hasReviewed;

  return (
    <div className="relative pt-24 pb-16">
      <section className="relative py-12">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
            Customer <span className="gradient-text">Reviews</span>
          </h1>
          <p className="text-lg text-gray-400 animate-fade-in-up stagger-1">
            See what our customers have to say about their experience
          </p>

          {stats.total > 0 && (
            <div className="flex items-center justify-center gap-8 mt-8 animate-fade-in-up stagger-2">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">
                  {stats.average}
                </div>
                <div className="flex justify-center mt-2">
                  {renderStars(Math.round(stats.average))}
                </div>
                <p className="text-gray-500 text-sm mt-2">Average Rating</p>
              </div>
              <div className="w-px h-20 bg-white/10" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{stats.total}</div>
                <p className="text-gray-500 text-sm mt-2">Total Reviews</p>
              </div>
            </div>
          )}

          {canWriteReview && (
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all animate-fade-in-up stagger-3"
            >
              <PenSquare className="w-5 h-5" />
              Write a Review
            </button>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid gap-6">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="glass rounded-2xl p-6 hover:border-cyan-500/30 transition-all card-tilt animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <Quote className="w-8 h-8 text-cyan-500/50 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      <p className="text-gray-300 mb-4 leading-relaxed">{review.content}</p>

                      <div className="flex items-center gap-3">
                        {review.users?.discord_avatar ? (
                          <img
                            src={review.users.discord_avatar}
                            alt={review.users.discord_username}
                            className="w-8 h-8 rounded-full ring-2 ring-cyan-500/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-white font-medium">
                          {review.users?.discord_username || 'Anonymous'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          Verified Purchase
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="glass rounded-3xl p-12 text-center animate-fade-in-up">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full glass flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-cyan-500" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">No Reviews Yet</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Be the first to share your experience! After making a purchase, you can leave a review to help others.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="/"
                    className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl transition-all hover:-translate-y-1"
                  >
                    Browse Shop
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-3 gap-6">
                {[
                  { title: 'Verified Purchases', desc: 'Only customers who completed orders can review' },
                  { title: 'Honest Feedback', desc: 'Unfiltered opinions from real customers' },
                  { title: 'Community Driven', desc: 'Help others make informed decisions' },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="glass rounded-xl p-5 text-center animate-fade-in-up"
                    style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsWriteModalOpen(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Write a Review</h2>
            <p className="text-gray-400 mb-6">Share your experience with DonutMC Store</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  {renderStars(reviewForm.rating, true, (rating) =>
                    setReviewForm({ ...reviewForm, rating })
                  )}
                </div>
              </div>

              {completedOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Related Order (optional)
                  </label>
                  <select
                    value={reviewForm.order_id}
                    onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="" className="bg-gray-800">No specific order</option>
                    {completedOrders.map((order) => (
                      <option key={order.id} value={order.id} className="bg-gray-800">
                        Order #{order.id.slice(0, 8).toUpperCase()} - ${order.total_amount}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
                <textarea
                  required
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Tell us about your experience..."
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="flex-1 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reviewForm.content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>

              <p className="text-center text-gray-500 text-xs">
                Your review will be visible after admin approval
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
