import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Modal } from '../Layout';
import { Calendar, Clock, MessageSquare, Loader2, RefreshCcw, Star } from 'lucide-react';
import { Booking } from '../../types';
import reviewService from '../../services/reviewService';
import orderService from '../../services/orderService';

interface ServiceRequestsProps {
  onMessageProvider: (userId: string) => void;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ onMessageProvider }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const syncReviewedBookings = async (completedBookings: Booking[]) => {
    if (completedBookings.length === 0) {
      setReviewedBookingIds(new Set());
      return;
    }

    try {
      const uniqueServiceIds = Array.from(new Set(completedBookings.map((booking) => booking.serviceId)));
      const reviewGroups = await Promise.all(
        uniqueServiceIds.map((serviceId) => reviewService.getServiceReviews(serviceId))
      );

      const completedBookingIdSet = new Set(completedBookings.map((booking) => booking.id));
      const reviewed = new Set<string>();

      reviewGroups.flat().forEach((review) => {
        if (completedBookingIdSet.has(review.bookingId)) {
          reviewed.add(review.bookingId);
        }
      });

      setReviewedBookingIds(reviewed);
    } catch (error) {
      console.error('Error fetching existing reviews:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      if (!refreshing) setLoading(true);
      const orders = await orderService.getMyOrders();
      const mapped: Booking[] = orderService.mapOrdersToBookings(orders);
      if (Array.isArray(mapped)) {
        setBookings(mapped);
        await syncReviewedBookings(mapped.filter((booking) => booking.status === 'COMPLETED'));
      } else {
        setBookings([]);
        setReviewedBookingIds(new Set());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const renderStatus = (status: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'IN_PROGRESS') return 'warning';
    if (status === 'CANCELLED') return 'danger';
    return 'default';
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking || submittingReview) {
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);
      await reviewService.createReview({
        bookingId: selectedBooking.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewedBookingIds((prev) => {
        const next = new Set(prev);
        next.add(selectedBooking.id);
        return next;
      });
      window.dispatchEvent(
        new CustomEvent('review:created', {
          detail: {
            serviceId: selectedBooking.serviceId,
          },
        })
      );
      setToastMessage('Thanks for your review.');
      setSelectedBooking(null);
    } catch (error: any) {
      setReviewError(error?.message || 'Unable to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold mb-2">Service Requests</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setRefreshing(true); fetchBookings(); }}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCcw size={14} className="mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} />
          Loading your requests...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
          No service requests yet. Book a provider to see it here.
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-700 transition-all">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg text-white">{booking.serviceTitle}</h4>
                    <Badge variant={renderStatus(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-1">Provider: <span className="text-slate-200">{booking.providerName}</span></p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:self-center self-end">
                <span className="font-bold text-lg">Ksh.{booking.price}</span>
                <Button
                  variant="secondary"
                  className="text-sm flex items-center gap-2"
                  onClick={() => onMessageProvider(booking.providerId)}
                >
                  <MessageSquare size={14} /> Message
                </Button>
                {booking.status === 'COMPLETED' && (
                  <Button
                    variant={reviewedBookingIds.has(booking.id) ? 'secondary' : 'primary'}
                    className="text-sm"
                    disabled={reviewedBookingIds.has(booking.id)}
                    onClick={() => openReviewModal(booking)}
                  >
                    {reviewedBookingIds.has(booking.id) ? 'Reviewed' : 'Leave Review'}
                  </Button>
                )}
                <Button variant="secondary" className="text-sm">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => {
          if (!submittingReview) {
            setSelectedBooking(null);
          }
        }}
        title="Leave a Review"
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm text-slate-400 mb-1">Service</p>
            <p className="text-white font-semibold">{selectedBooking?.serviceTitle}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Rating</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="text-yellow-400 disabled:opacity-60"
                  disabled={submittingReview}
                >
                  <Star size={22} fill={value <= reviewRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Comment (optional)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={submittingReview}
              maxLength={1000}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="Share your experience with this provider..."
            />
          </div>

          {reviewError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {reviewError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSelectedBooking(null)}
              disabled={submittingReview}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>

      {toastMessage && (
        <div className="fixed right-4 bottom-4 z-50 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
