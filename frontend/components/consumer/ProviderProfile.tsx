import React, { useState, useEffect } from 'react';
import { Service } from '../../types';
import { Card, Button, Badge, Modal, cn } from '../Layout';
import { ArrowLeft, Star, Phone, Mail, Globe, MapPin, CheckCircle, PlusCircle, Loader2, Smartphone, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  consumer: {
    _id: string;
    name: string;
    avatar: string;
  };
  service: {
    _id: string;
    title: string;
    image: string;
  };
  createdAt: string;
}

interface ProviderProfileProps {
  service: Service;
  onBack: () => void;
  bookingCart: string[];
  toggleCartItem: (serviceId: string) => void;
  showBookingModal: boolean;
  setShowBookingModal: (show: boolean) => void;
  onPaymentSuccess: () => void;
  onMessageProvider: (userId: string) => void;
}

type PaymentStep = 'schedule' | 'details' | 'summary' | 'phone' | 'processing' | 'pending_confirmation' | 'success';

export const ProviderProfile: React.FC<ProviderProfileProps> = ({
  service: selectedService,
  onBack,
  bookingCart,
  toggleCartItem,
  showBookingModal,
  setShowBookingModal,
  onPaymentSuccess,
  onMessageProvider
}) => {
  const [activeTab, setActiveTab] = useState('About');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('schedule');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>('09:00 AM');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [processingTime, setProcessingTime] = useState(0);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [providerPortfolio, setProviderPortfolio] = useState<string[]>([]);
  const [providerBio, setProviderBio] = useState<string>('');
  const [providerPhone, setProviderPhone] = useState<string>('');
  const [providerWebsite, setProviderWebsite] = useState<string>('');
  const [providerAddress, setProviderAddress] = useState<string>('');
  const [providerCoverImage, setProviderCoverImage] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Time slots for scheduling
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM'
  ];

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

  // Load provider profile data (portfolio, bio, contact info)
  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch(`/api/users/providers/${selectedService.providerId}`);
        const data = await res.json();

        if (res.ok && data) {
          setProviderPortfolio(Array.isArray(data.portfolio) ? data.portfolio : []);
          setProviderBio(data.bio || '');
          setProviderPhone(data.phone || '');
          setProviderWebsite(data.website || '');
          setProviderAddress(data.address || '');
          setProviderCoverImage(data.coverImage || '');
        }
      } catch (error) {
        console.error('Error fetching provider profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProviderProfile();
  }, [selectedService]);

  // Load provider reviews
  useEffect(() => {
    const fetchProviderReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await fetch(`/api/reviews/provider/${selectedService.providerId}`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setProviderReviews(data);
        }
      } catch (error) {
        console.error('Error fetching provider reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProviderReviews();
  }, [selectedService]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate cart details
  const selectedServicesList = providerServices.filter(s => bookingCart.includes(s.id));
  const totalAmount = selectedServicesList.reduce((sum, item) => sum + item.price, 0);

  // Reset payment step when modal opens/closes
  useEffect(() => {
    if (showBookingModal) {
      setPaymentStep('schedule');
      setPhoneNumber('');
      setProcessingTime(0);
      setTransactionId(null);
      setPaymentError(null);
      setBookingNotes('');
    }
  }, [showBookingModal]);

  const pollPaymentStatus = async (txId: string) => {
    const token = localStorage.getItem('token');
    const startedAt = Date.now();
    const maxWaitMs = 240000;

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const elapsed = Date.now() - startedAt;
        setProcessingTime(Math.min(95, Math.round((elapsed / maxWaitMs) * 95)));

        if (elapsed > maxWaitMs) {
          clearInterval(intervalId);
          const timeoutError = new Error('Payment confirmation is taking longer than expected.');
          (timeoutError as any).code = 'PENDING_CONFIRMATION';
          reject(timeoutError);
          return;
        }

        try {
          const res = await fetch(`/api/transactions/${txId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data?.status) {
            if (data.status === 'COMPLETED') {
              clearInterval(intervalId);
              resolve(data);
            } else if (data.status === 'FAILED') {
              clearInterval(intervalId);
              reject(new Error('Payment failed or was cancelled.'));
            }
          }
        } catch (error) {
          // Keep polling on transient errors
        }
      }, 3000);
    });
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
          serviceIds: selectedServicesList.map((item) => item.id),
          date: `${bookingDate} ${bookingTimeSlot}`,
          notes: bookingNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      setTransactionId(data.transactionId);
      await pollPaymentStatus(data.transactionId);

      setProcessingTime(100);
      setPaymentStep('success');
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'PENDING_CONFIRMATION') {
        setPaymentError('Payment confirmation is delayed. If you completed the STK prompt, tap "Check Again".');
        setPaymentStep('pending_confirmation');
      } else {
        setPaymentError(error.message || 'Payment failed');
        setPaymentStep('phone');
      }
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleCheckAgain = async () => {
    if (!transactionId || creatingBooking) return;
    try {
      setCreatingBooking(true);
      setPaymentError(null);
      setPaymentStep('processing');
      await pollPaymentStatus(transactionId);
      setProcessingTime(100);
      setPaymentStep('success');
    } catch (error: any) {
      if (error?.code === 'PENDING_CONFIRMATION') {
        setPaymentError('Still waiting for callback confirmation. You can check again shortly.');
        setPaymentStep('pending_confirmation');
      } else {
        setPaymentError(error?.message || 'Unable to verify payment yet.');
        setPaymentStep('pending_confirmation');
      }
    } finally {
      setCreatingBooking(false);
    }
  };

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
        <span className="text-white font-medium">{selectedService.providerName}</span>
      </div>

      {/* Hero Image */}
      <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden relative">
        <img src={selectedService.image} alt={selectedService.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Header Profile Info */}
      <div className="relative -mt-20 px-4 md:px-8 flex flex-col md:flex-row items-end md:items-center gap-6">
        <div className="w-32 h-32 rounded-xl bg-slate-800 border-4 border-slate-950 overflow-hidden shadow-2xl flex-shrink-0">
          <img src={selectedService.providerAvatar} alt={selectedService.providerName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 mb-2">
          <h1 className="text-3xl font-bold text-white mb-1">{selectedService.providerName}</h1>
          <p className="text-slate-400 text-lg mb-2">{selectedService.title}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-yellow-400">
              <Star size={16} fill="currentColor" />
              <span className="ml-1 font-bold text-white">{selectedService.rating}</span>
            </div>
            <span className="text-slate-500">({selectedService.reviews} reviews)</span>
          </div>
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
                <Phone size={18} className="text-slate-500" /> (123) 456-7890
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-slate-500" /> contact@{selectedService.providerName.toLowerCase().replace(/ /g, '').replace(/'/g, '')}.com
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Globe size={18} className="text-slate-500" /> {selectedService.providerName.toLowerCase().replace(/ /g, '').replace(/'/g, '')}.com
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={18} className="text-slate-500" /> 123 Main Street, New York, USA
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
              <h3 className="text-xl font-bold text-white mb-4">About {selectedService.providerName}</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                With over 15 years of experience serving the New York area, {selectedService.providerName} is your trusted partner for all residential and commercial needs. We pride ourselves on quality workmanship, transparent pricing, and unparalleled customer service. Our team of certified and insured professionals is equipped to handle everything from routine maintenance to complex installations, ensuring every job is done right the first time.
              </p>
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
              {profileLoading ? (
                <div className="flex items-center gap-2 text-slate-400 py-8">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  Loading portfolio...
                </div>
              ) : providerPortfolio.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {providerPortfolio.map((image, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden bg-slate-800 relative group">
                      <img src={image} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/20">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 mb-2">No portfolio images uploaded yet</p>
                  <p className="text-sm text-slate-500">This provider hasn't added portfolio images</p>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'Reviews' && (
            <div id="reviews" className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Customer Reviews</h3>
              {reviewsLoading ? (
                <div className="flex items-center gap-2 text-slate-400 py-8">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  Loading reviews...
                </div>
              ) : providerReviews.length > 0 ? (
                <div className="space-y-4">
                  {providerReviews.map((review) => (
                    <div key={review._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                            {review.consumer?.avatar ? (
                              <img src={review.consumer.avatar} alt={review.consumer.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {review.consumer?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-white">{review.consumer?.name || 'Anonymous'}</h5>
                            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} fill={s <= review.rating ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      {review.service && (
                        <p className="text-xs text-slate-500 mb-2">
                          Service: <span className="text-slate-400">{review.service.title}</span>
                        </p>
                      )}
                      {review.comment && (
                        <p className="text-slate-400 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 mb-2">No reviews yet</p>
                  <p className="text-sm text-slate-500">This provider hasn't received any reviews</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking & Payment Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title={paymentStep === 'success' ? 'Payment Successful' : 'Complete Your Booking'}
      >
        <div className="min-h-[400px] flex flex-col">
          {/* Progress Steps Indicator */}
          {['schedule', 'details', 'summary', 'phone'].includes(paymentStep) && (
            <div className="flex items-center justify-between mb-8 px-2">
              {[
                { step: 'schedule', label: 'Schedule' },
                { step: 'details', label: 'Details' },
                { step: 'summary', label: 'Review' },
                { step: 'phone', label: 'Pay' }
              ].map((item, idx, arr) => {
                const stepIdx = arr.findIndex(a => a.step === paymentStep);
                const isActive = item.step === paymentStep;
                const isPast = arr.findIndex(a => a.step === item.step) < stepIdx;
                
                return (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isActive ? "bg-blue-600 text-white ring-4 ring-blue-900/30" : 
                        isPast ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500"
                      )}>
                        {isPast ? <CheckCircle size={14} /> : idx + 1}
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        isActive ? "text-blue-400" : "text-slate-500"
                      )}>{item.label}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={cn(
                        "flex-1 h-px mb-6",
                        idx < stepIdx ? "bg-emerald-600" : "bg-slate-800"
                      )}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {paymentStep === 'schedule' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Select Time Slot</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setBookingTimeSlot(slot)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                          bookingTimeSlot === slot ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                className="w-full py-3" 
                disabled={!bookingDate || !bookingTimeSlot}
                onClick={() => setPaymentStep('details')}
              >
                Continue to Details <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {paymentStep === 'details' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Additional Notes (Optional)</label>
                <textarea
                  placeholder="Describe your specific needs or any details the provider should know..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all min-h-[150px] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setPaymentStep('schedule')}>Back</Button>
                <Button className="flex-[2]" onClick={() => setPaymentStep('summary')}>Review Order</Button>
              </div>
            </div>
          )}

          {paymentStep === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {selectedServicesList.length > 0 ? (
                <>
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Order Summary</h4>
                      <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                        {new Date(bookingDate).toLocaleDateString()} at {bookingTimeSlot}
                      </Badge>
                    </div>
                    <div className="space-y-3 mb-4">
                      {selectedServicesList.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-white">{item.title}</span>
                          <span className="text-slate-400 font-mono">Ksh {item.price}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-base">
                        <span className="text-white">Total</span>
                        <span className="text-emerald-400">Ksh {totalAmount}</span>
                      </div>
                    </div>
                    {bookingNotes && (
                      <div className="border-t border-slate-800 pt-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Your Notes</p>
                        <p className="text-xs text-slate-400 italic line-clamp-2">"{bookingNotes}"</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                    <ShieldCheck className="text-blue-500 flex-shrink-0" size={20} />
                    <p className="text-xs text-blue-200">
                      Payment is held in secure escrow. The pro only gets paid after you confirm the job is done.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setPaymentStep('details')}>Back</Button>
                    <Button className="flex-[2]" onClick={() => setPaymentStep('phone')}>Proceed to Payment</Button>
                  </div>
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
                <p className="text-slate-400 text-sm">Enter your M-Pesa number to pay <span className="text-white font-bold">Ksh {totalAmount}</span></p>
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
                  <p className="text-xs text-slate-500 text-center">We will send an STK push to this number.</p>
                </div>

                <div className="flex gap-3">
                   <Button variant="secondary" className="flex-1" onClick={() => setPaymentStep('summary')}>Back</Button>
                   <Button
                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                    onClick={handlePay}
                    disabled={phoneNumber.length < 9 || creatingBooking}
                  >
                    {creatingBooking ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
                {paymentError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {paymentError}
                  </div>
                )}
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

          {paymentStep === 'pending_confirmation' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                  <Smartphone className="text-amber-400" size={30} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Awaiting Confirmation</h3>
                <p className="text-slate-400 text-sm">
                  We have not received the M-Pesa callback yet. If you completed the STK prompt, check again.
                </p>
              </div>
              {paymentError && (
                <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  {paymentError}
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCheckAgain} disabled={creatingBooking}>
                  {creatingBooking ? 'Checking...' : 'Check Again'}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={onPaymentSuccess}>
                  Go to Requests
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/50">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                Your payment of <span className="text-white font-bold">Ksh {totalAmount}</span> was successful. The provider has been notified.
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
