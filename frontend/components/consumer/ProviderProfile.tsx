import React, { useState, useEffect } from 'react';
import { Review, Service, User } from '../../types';
import { Card, Button, Badge, Modal, cn } from '../Layout';
import { ArrowLeft, Star, Phone, Mail, Globe, MapPin, CheckCircle, PlusCircle, Loader2, Smartphone, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import reviewService from '../../services/reviewService';

interface ProviderProfileProps {
  service: Service;
  canLike?: boolean;
  onBack: () => void;
  bookingCart: string[];
  toggleCartItem: (serviceId: string) => void;
  showBookingModal: boolean;
  setShowBookingModal: (show: boolean) => void;
  onPaymentSuccess: () => void;
  onMessageProvider: (userId: string) => void;
}

type PaymentStep = 'summary' | 'phone' | 'processing' | 'success';

export const ProviderProfile: React.FC<ProviderProfileProps> = ({
  service: selectedService,
  canLike = false,
  onBack,
  bookingCart,
  toggleCartItem,
  showBookingModal,
  setShowBookingModal,
  onPaymentSuccess,
  onMessageProvider
}) => {
  const [activeTab, setActiveTab] = useState('About');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('summary');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingTime, setProcessingTime] = useState(0);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [providerProfile, setProviderProfile] = useState<Partial<User> | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState({
    rating: selectedService.rating || 0,
    reviews: selectedService.reviews || 0,
  });

  // Load provider services from API so consumers see live listings
  useEffect(() => {
    const fetchProviderServices = async () => {
      try {
        setServicesLoading(true);
        const res = await fetch(`/api/services/provider/${selectedService.providerId}`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          const mapped = data.map((s: any): Service => ({
            id: s._id,
            providerId: s.provider?._id || selectedService.providerId,
            providerName: s.provider?.name || selectedService.providerName,
            providerAvatar: s.provider?.avatar || selectedService.providerAvatar,
            title: s.title,
            description: s.description,
            category: s.category,
            price: s.price,
            rating: s.rating ?? 0,
            reviews: s.reviews ?? 0,
            image: s.image
          }));

          // Ensure the originally clicked service is present even if API returns empty
          const hasSelected = mapped.some(s => s.id === selectedService.id);
          setProviderServices(hasSelected ? mapped : [selectedService, ...mapped]);
        } else {
          // Fallback to showing just the selected service so UI isn't blank
          setProviderServices([selectedService]);
        }
      } catch (error) {
        console.error('Error fetching provider services:', error);
        setProviderServices([selectedService]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchProviderServices();
  }, [selectedService]);

  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        setProviderLoading(true);
        const res = await fetch(`/api/users/providers/${selectedService.providerId}`);
        const data = await res.json();
        if (res.ok) {
          setProviderProfile(data);
        } else {
          setProviderProfile(null);
        }
      } catch (error) {
        console.error('Error fetching provider profile:', error);
        setProviderProfile(null);
      } finally {
        setProviderLoading(false);
      }
    };

    if (selectedService.providerId) {
      fetchProviderProfile();
    }
  }, [selectedService.providerId]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!canLike || !selectedService.providerId) {
        setLiked(false);
        setLikesCount(0);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/providers/${selectedService.providerId}/like-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLiked(Boolean(data.liked));
          setLikesCount(Number(data.likesCount || 0));
        }
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };

    fetchLikeStatus();
  }, [canLike, selectedService.providerId]);

  const handleToggleLike = async () => {
    if (!canLike || liking || !selectedService.providerId) {
      return;
    }

    try {
      setLiking(true);
      setLikeError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/providers/${selectedService.providerId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to update like');
      }
      setLiked(Boolean(data.liked));
      setLikesCount(Number(data.likesCount || 0));
    } catch (error: any) {
      setLikeError(error?.message || 'Unable to update like');
    } finally {
      setLiking(false);
    }
  };

  useEffect(() => {
    setServiceMetrics({
      rating: selectedService.rating || 0,
      reviews: selectedService.reviews || 0,
    });
  }, [selectedService.id, selectedService.rating, selectedService.reviews]);

  useEffect(() => {
    const refreshServiceMetrics = async () => {
      try {
        const res = await fetch(`/api/services/${selectedService.id}`);
        const data = await res.json();
        if (res.ok) {
          setServiceMetrics({
            rating: data.rating ?? 0,
            reviews: data.reviews ?? 0,
          });
        }
      } catch (error) {
        console.error('Error refreshing service metrics:', error);
      }
    };

    if (selectedService.id) {
      refreshServiceMetrics();
    }

    const handleReviewCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ serviceId?: string }>;
      if (customEvent.detail?.serviceId === selectedService.id) {
        refreshServiceMetrics();
      }
    };

    window.addEventListener('review:created', handleReviewCreated as EventListener);
    return () => {
      window.removeEventListener('review:created', handleReviewCreated as EventListener);
    };
  }, [selectedService.id]);

  useEffect(() => {
    const fetchServiceReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const data = await reviewService.getServiceReviews(selectedService.id);
        setReviews(data);
      } catch (error: any) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
        setReviewsError(error?.message || 'Unable to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    };

    if (selectedService.id) {
      fetchServiceReviews();
    }
  }, [selectedService.id]);

  // Calculate cart details
  const selectedServicesList = providerServices.filter(s => bookingCart.includes(s.id));
  const totalAmount = selectedServicesList.reduce((sum, item) => sum + item.price, 0);

  // Reset payment step when modal opens/closes
  useEffect(() => {
    if (showBookingModal) {
      setPaymentStep('summary');
      setPhoneNumber('');
      setProcessingTime(0);
      setTransactionId(null);
      setPaymentError(null);
    }
  }, [showBookingModal]);

  const pollPaymentStatus = async (txId: string) => {
    const token = localStorage.getItem('token');
    const startedAt = Date.now();
    const maxWaitMs = 180000;
    const pollIntervalMs = 3000;

    const checkStatus = async () => {
      const res = await fetch(`/api/transactions/${txId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.status) return null;
      return data;
    };

    while (Date.now() - startedAt <= maxWaitMs) {
      const elapsed = Date.now() - startedAt;
      setProcessingTime(Math.min(95, Math.round((elapsed / maxWaitMs) * 95)));

      try {
        const data = await checkStatus();
        if (data?.status === 'COMPLETED') {
          return data;
        }
        if (data?.status === 'FAILED') {
          throw new Error('Payment failed or was cancelled.');
        }
      } catch (error: any) {
        if (error?.message === 'Payment failed or was cancelled.') {
          throw error;
        }
        // Keep polling on transient errors
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    // One final check to avoid false timeout when callback lands near the deadline.
    try {
      const finalData = await checkStatus();
      if (finalData?.status === 'COMPLETED') {
        return finalData;
      }
      if (finalData?.status === 'FAILED') {
        throw new Error('Payment failed or was cancelled.');
      }
    } catch (error: any) {
      if (error?.message === 'Payment failed or was cancelled.') {
        throw error;
      }
    }

    throw new Error('Payment confirmation is taking longer than expected. Please wait a moment and check your Payments page.');
  };

  const handlePay = async () => {
    if (!phoneNumber || selectedServicesList.length === 0 || creatingBooking) return;
    setPaymentStep('processing');
    setCreatingBooking(true);
    setPaymentError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber,
          serviceIds: selectedServicesList.map((item) => item.id)
        })
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      setTransactionId(data.transactionId);
      await pollPaymentStatus(data.transactionId);

      setProcessingTime(100);
      setPaymentStep('success');
    } catch (error: any) {
      console.error(error);
      setPaymentError(error.message || 'Payment failed');
      setPaymentStep('phone');
    } finally {
      setCreatingBooking(false);
    }
  };

  const providerName = providerProfile?.name || selectedService.providerName;
  const providerAvatar = providerProfile?.avatar || selectedService.providerAvatar;
  const providerTagline = providerProfile?.tagline || selectedService.title;
  const providerBio = providerProfile?.bio || 'This provider has not added a bio yet.';
  const providerCover = providerProfile?.coverImage || selectedService.image;
  const providerPortfolio = providerProfile?.portfolio || [];
  const providerEmail = providerProfile?.email || `contact@${providerName.toLowerCase().replace(/ /g, '').replace(/'/g, '')}.com`;
  const providerPhone = providerProfile?.phone || '(123) 456-7890';
  const providerWebsite = providerProfile?.website || `${providerName.toLowerCase().replace(/ /g, '').replace(/'/g, '')}.com`;
  const providerAddress = providerProfile?.address || 'Address not provided';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <button onClick={onBack} className="hover:text-white flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>
        <span>/</span>
        <span>{selectedService.category}</span>
        <span>/</span>
        <span className="text-white font-medium">{providerName}</span>
      </div>

      {/* Hero Image */}
      <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden relative">
        <img src={providerCover} alt={providerName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Header Profile Info */}
      <div className="relative -mt-20 px-4 md:px-8 flex flex-col md:flex-row items-end md:items-center gap-6">
        <div className="w-32 h-32 rounded-xl bg-slate-800 border-4 border-slate-950 overflow-hidden shadow-2xl flex-shrink-0">
          <img src={providerAvatar} alt={providerName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 mb-2">
          <h1 className="text-3xl font-bold text-white mb-1">{providerName}</h1>
          <p className="text-slate-400 text-lg mb-2">{providerTagline}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center text-yellow-400">
              <Star size={16} fill="currentColor" />
              <span className="ml-1 font-bold text-white">{serviceMetrics.rating}</span>
            </div>
            <span className="text-slate-500">({serviceMetrics.reviews} reviews)</span>
            {canLike && (
              <>
                <Button
                  variant={liked ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleToggleLike}
                  disabled={liking}
                  className={liked ? 'border-rose-500/40 text-rose-300' : ''}
                >
                  {liking ? 'Please wait...' : liked ? 'Unlike Profile' : 'Like Profile'}
                </Button>
                <span className="text-slate-500 text-sm">{likesCount} like{likesCount === 1 ? '' : 's'}</span>
              </>
            )}
          </div>
          {likeError && <p className="text-xs text-red-400 mt-2">{likeError}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mt-6">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          {['About', 'Services', 'Portfolio', 'Reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap",
                activeTab === tab ? "text-blue-500" : "text-slate-400 hover:text-white"
              )}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-white mb-4">Contact Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Phone size={18} className="text-slate-500" /> {providerPhone}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-slate-500" /> {providerEmail}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Globe size={18} className="text-slate-500" /> {providerWebsite}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={18} className="text-slate-500" /> {providerAddress}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-white mb-4">Business Hours</h3>
            <div className="space-y-2 text-sm">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <div key={day} className="flex justify-between">
                  <span className="text-slate-400">{day}</span>
                  <span className="text-slate-200">9:00 AM - 5:00 PM</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-slate-400">Saturday</span>
                <span className="text-slate-500">Closed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sunday</span>
                <span className="text-slate-500">Closed</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3 sticky top-6">
            <Button className="w-full py-3 shadow-blue-900/20" onClick={() => setShowBookingModal(true)}>
              Book & Pay {bookingCart.length > 0 && `(${bookingCart.length})`}
            </Button>
            <Button
              variant="secondary"
              className="w-full py-3"
              onClick={() => onMessageProvider(selectedService.providerId)}
            >
              Message Provider
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          {activeTab === 'About' && (
            <div id="about" className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-white mb-4">About {providerName}</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                {providerBio}
              </p>
              {providerLoading && (
                <p className="text-xs text-slate-500">Refreshing profile details...</p>
              )}
            </div>
          )}

          {/* Services Tab - Dynamic */}
          {activeTab === 'Services' && (
            <div id="services" className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Services Offered</h3>
              <div className="grid gap-4">
                {servicesLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                    Fetching latest services...
                  </div>
                ) : providerServices.length > 0 ? providerServices.map((service) => {
                  const isAdded = bookingCart.includes(service.id);
                  return (
                    <div key={service.id} className={cn(
                      "bg-slate-900 border rounded-xl p-5 transition-all",
                      isAdded ? "border-blue-500/50 bg-blue-900/5" : "border-slate-800 hover:border-slate-700"
                    )}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-white">{service.title}</h4>
                            <span className="font-bold text-blue-400 text-lg md:hidden">Ksh {service.price}</span>
                          </div>
                          <p className="text-slate-400 text-sm leading-relaxed mb-3">{service.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{service.category}</Badge>
                            <span className="text-xs text-slate-500">Fixed Price</span>
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 md:w-48 flex-shrink-0">
                          <span className="hidden md:block font-bold text-2xl text-white">Ksh {service.price}</span>
                          <Button
                            variant={isAdded ? "secondary" : "primary"}
                            className={cn("w-full transition-all", isAdded ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "")}
                            onClick={() => toggleCartItem(service.id)}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle size={18} className="mr-2" /> Added
                              </>
                            ) : (
                              <>
                                <PlusCircle size={18} className="mr-2" /> Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 text-slate-500">
                    No services listed for this provider yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {activeTab === 'Portfolio' && (
            <div id="portfolio" className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Portfolio</h3>
              {providerPortfolio.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {providerPortfolio.map((src, index) => (
                    <div key={`${src}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-slate-800 relative group">
                      <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/20">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No portfolio images available yet.</div>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'Reviews' && (
            <div id="reviews" className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Customer Reviews</h3>
              {reviewsLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  Loading reviews...
                </div>
              ) : reviewsError ? (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  {reviewsError}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-slate-500 text-sm">No reviews yet for this service.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                            {review.consumerAvatar ? (
                              <img src={review.consumerAvatar} alt={review.consumerName} className="w-full h-full object-cover" />
                            ) : (
                              review.consumerName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-white">{review.consumerName}</h5>
                            <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              size={14}
                              fill={value <= review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {review.comment || 'No comment provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title={paymentStep === 'success' ? 'Payment Successful' : 'Complete Booking'}
      >
        <div className="min-h-[300px] flex flex-col">
          {paymentStep === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {selectedServicesList.length > 0 ? (
                <>
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Order Summary</h4>
                    <div className="space-y-3">
                      {selectedServicesList.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-white">{item.title}</span>
                          <span className="text-slate-400 font-mono">Ksh.{item.price}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-base">
                        <span className="text-white">Total</span>
                        <span className="text-emerald-400">Ksh.{totalAmount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                    <ShieldCheck className="text-blue-500 flex-shrink-0" size={20} />
                    <p className="text-xs text-blue-200">
                      Your payment is held in escrow until the service is marked as completed.
                    </p>
                  </div>
                  <Button className="w-full py-3" onClick={() => setPaymentStep('phone')}>
                    Proceed to Payment <ChevronRight size={16} className="ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="text-slate-500" size={32} />
                  </div>
                  <p className="text-slate-400 mb-6">You haven't selected any services yet.</p>
                  <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Browse Services</Button>
                </div>
              )}
            </div>
          )}

          {paymentStep === 'phone' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Smartphone className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">M-Pesa Payment</h3>
                <p className="text-slate-400 text-sm">Enter your M-Pesa number to pay <span className="text-white font-bold">Ksh.{totalAmount}</span></p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">+254</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600 font-mono"
                      placeholder="712 345 678"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-500">We will send an STK push to this number.</p>
                </div>

                <Button
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                  onClick={handlePay}
                  disabled={phoneNumber.length < 9 || creatingBooking}
                >
                  {creatingBooking ? 'Processing...' : 'Pay Now'}
                </Button>
                {paymentError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {paymentError}
                  </div>
                )}
                <button
                  onClick={() => setPaymentStep('summary')}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-2"
                >
                  Back to Summary
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 animate-in fade-in duration-500">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="text-slate-600" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your phone</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">
                We've sent an M-Pesa prompt to <span className="text-emerald-400 font-mono">+254 {phoneNumber}</span>. Please enter your PIN to complete the transaction.
              </p>
              <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${processingTime}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Connecting to M-Pesa...</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/50">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                Your payment of <span className="text-white font-bold">Ksh.{totalAmount}</span> was successful. The provider has been notified.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 w-full mb-6 text-left">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Transaction ID</span>
                  <span>Date</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300 font-mono">
                  <span>{transactionId ? transactionId.toString().slice(-10).toUpperCase() : 'MPESA'}</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <Button className="w-full" onClick={onPaymentSuccess}>View Requests</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
