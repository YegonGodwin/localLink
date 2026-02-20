import React, { useState, useEffect } from 'react';
import { Service, User } from '../../types';
import { Button, cn } from '../Layout';
import { Search, MapPin, Filter, ChevronDown, Heart, Star, MessageSquare, Loader2 } from 'lucide-react';

interface ExploreServicesProps {
   user?: User;
   onSelectService: (service: Service) => void;
   onMessageProvider: (userId: string) => void;
}

interface ProviderGroup {
   providerId: string;
   providerName: string;
   providerAvatar: string;
   services: Service[];
}

interface ProviderCard extends ProviderGroup {
   featuredService?: Service;
   minPrice: number;
   uniqueCategories: string[];
}

export const ExploreServices: React.FC<ExploreServicesProps> = ({ user, onSelectService, onMessageProvider }) => {
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [location, setLocation] = useState(user?.location || 'New York, NY');
   const [isLocating, setIsLocating] = useState(false);
   const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
   const [providerLikes, setProviderLikes] = useState<Record<string, { liked: boolean; likesCount: number; loading: boolean }>>({});

   const fetchServices = async () => {
      try {
         setLoading(true);
         const res = await fetch('/api/services');
         const data = await res.json();
         if (res.ok) {
            // Map backend structure to frontend Service interface
            const mappedServices = data.map((s: any) => ({
               id: s._id,
               providerId: s.provider?._id || '',
               providerName: s.provider?.name || 'Local Pro',
               providerAvatar: s.provider?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
               title: s.title,
               description: s.description,
               category: s.category,
               price: s.price,
               rating: s.rating || 0,
               reviews: s.reviews || 0,
               image: s.image
            }));
            setServices(mappedServices);
         }
      } catch (error) {
         console.error('Error fetching services:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchServices();
   }, []);

   useEffect(() => {
      const loadProviderLikeStatuses = async () => {
         if (user?.role !== 'CONSUMER') {
            return;
         }

         const token = localStorage.getItem('token');
         if (!token) {
            return;
         }

         const providerIds = Array.from(
            new Set(
               services
                  .map((s) => s.providerId)
                  .filter((providerId): providerId is string => typeof providerId === 'string' && providerId.length > 0)
            )
         );
         if (providerIds.length === 0) {
            return;
         }

         try {
            const results: Array<{ providerId: string; liked: boolean; likesCount: number }> = await Promise.all(
               providerIds.map(async (providerId: string) => {
                  const res = await fetch(`/api/users/providers/${providerId}/like-status`, {
                     headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json();
                  if (!res.ok) {
                     return { providerId, liked: false, likesCount: 0 };
                  }
                  return {
                     providerId,
                     liked: Boolean(data.liked),
                     likesCount: Number(data.likesCount || 0),
                  };
               })
            );

            setProviderLikes((prev) => {
               const next = { ...prev };
               results.forEach((item) => {
                  next[item.providerId] = {
                     liked: item.liked,
                     likesCount: item.likesCount,
                     loading: false,
                  };
               });
               return next;
            });
         } catch (error) {
            console.error('Error loading provider likes:', error);
         }
      };

      loadProviderLikeStatuses();
   }, [services, user?.role]);

   useEffect(() => {
      const handleReviewCreated = async (event: Event) => {
         const customEvent = event as CustomEvent<{ serviceId?: string }>;
         const serviceId = customEvent.detail?.serviceId;
         if (!serviceId) {
            return;
         }

         try {
            const res = await fetch(`/api/services/${serviceId}`);
            const data = await res.json();
            if (!res.ok) {
               return;
            }

            setServices((prev) =>
               prev.map((service) =>
                  service.id === serviceId
                     ? {
                        ...service,
                        rating: data.rating ?? service.rating,
                        reviews: data.reviews ?? service.reviews,
                     }
                     : service
               )
            );
         } catch (error) {
            console.error('Error refreshing service rating after review:', error);
         }
      };

      window.addEventListener('review:created', handleReviewCreated as EventListener);
      return () => {
         window.removeEventListener('review:created', handleReviewCreated as EventListener);
      };
   }, []);

   useEffect(() => {
      const fetchLocation = async () => {
         if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
               async (position) => {
                  try {
                     const { latitude, longitude } = position.coords;
                     const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                     );
                     const data = await response.json();
                     if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county;
                        const state = data.address.state || data.address.region;
                        const formattedAddress = city && state ? `${city}, ${state}` : data.display_name.split(',')[0] + ', ' + (data.address.country || '');
                        setLocation(formattedAddress);
                     }
                  } catch (error) {
                     console.error("Error fetching location:", error);
                  } finally {
                     setIsLocating(false);
                  }
               },
               (error) => {
                  console.error("Error getting geolocation:", error);
                  setIsLocating(false);
               }
            );
         }
      };

      // Only fetch if location is default or missing
      if (!user?.location || user.location === 'New York, NY') {
         fetchLocation();
      }
   }, [user?.location]);

   const [selectedCategory, setSelectedCategory] = useState('All');

   const filteredServices = services.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
   });

   const providers = filteredServices.reduce<Record<string, ProviderGroup>>((acc, service) => {
      const providerId = service.providerId || `unknown-${service.id}`;
      if (!acc[providerId]) {
         acc[providerId] = {
            providerId,
            providerName: service.providerName,
            providerAvatar: service.providerAvatar,
            services: []
         };
      }
      acc[providerId].services.push(service);
      return acc;
   }, {});

   const providerValues = Object.values(providers) as ProviderGroup[];
   const providerCards: ProviderCard[] = providerValues.map((provider) => {
      const featuredService = provider.services[0];
      const minPrice = provider.services.reduce((min, s) => Math.min(min, s.price), provider.services[0]?.price || 0);
      const uniqueCategories = Array.from(new Set(provider.services.map(s => s.category))).slice(0, 3);
      return { ...provider, featuredService, minPrice, uniqueCategories };
   });

   const handleToggleProviderLike = async (providerId: string) => {
      if (user?.role !== 'CONSUMER') {
         return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
         return;
      }

      setProviderLikes((prev) => ({
         ...prev,
         [providerId]: {
            liked: prev[providerId]?.liked || false,
            likesCount: prev[providerId]?.likesCount || 0,
            loading: true,
         },
      }));

      try {
         const res = await fetch(`/api/users/providers/${providerId}/like`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
         });
         const data = await res.json();
         if (!res.ok) {
            throw new Error(data?.message || 'Unable to update like');
         }

         setProviderLikes((prev) => ({
            ...prev,
            [providerId]: {
               liked: Boolean(data.liked),
               likesCount: Number(data.likesCount || 0),
               loading: false,
            },
         }));
      } catch (error) {
         console.error('Error toggling provider like:', error);
         setProviderLikes((prev) => ({
            ...prev,
            [providerId]: {
               liked: prev[providerId]?.liked || false,
               likesCount: prev[providerId]?.likesCount || 0,
               loading: false,
            },
         }));
      }
   };

   return (
      <div className="space-y-8">
         {/* Header */}
         <div>
            <h1 className="text-3xl font-bold text-white mb-2">Explore Services</h1>
            <p className="text-slate-400">Discover top-rated professionals in your area for any task.</p>
         </div>

         {/* Search Bar */}
         <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-lg">
            <div className="flex-1 flex items-center px-4 border-r border-slate-800">
               <Search className="text-slate-500 mr-3" size={20} />
               <input
                  type="text"
                  placeholder="What service are you looking for? (e.g., plumber, cleaning)"
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="flex-1 flex items-center px-4">
               <MapPin className={cn("text-slate-500 mr-3", isLocating && "animate-pulse text-blue-500")} size={20} />
               <input
                  type="text"
                  placeholder="Location"
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 outline-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
               />
            </div>
            <Button className="h-auto rounded-lg px-8">Search</Button>
         </div>

         {/* Horizontal Filters */}
         <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors">
               <Filter size={16} /> Filters
            </button>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
               {['All', 'Plumbing', 'Cleaning', 'Electrical', 'Gardening', 'Moving'].map((cat) => (
                  <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={cn(
                        "px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors",
                        selectedCategory === cat ? "bg-slate-800 text-white border-slate-700 font-medium" : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                     )}
                  >
                     {cat}
                  </button>
               ))}
            </div>
         </div>

         {/* Main Content: Count & Sorting */}
         <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Showing <span className="text-white font-bold">{providerCards.length}</span> of <span className="text-white font-bold">{providerCards.length}</span> providers</span>
            <div className="flex items-center gap-2">
               <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                  Recommended <ChevronDown size={14} />
               </button>
            </div>
         </div>

         {/* Provider Cards Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {loading ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <p>Finding top-rated services...</p>
               </div>
            ) : providerCards.length === 0 ? (
               <div className="col-span-full py-20 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <Search size={48} className="text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-slate-400 max-w-sm">Try adjusting your filters or searching for something else.</p>
               </div>
            ) : providerCards.map((provider) => (
               <div key={provider.providerId} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group relative">
                  {(() => {
                     const likeState = providerLikes[provider.providerId];
                     const isLiked = Boolean(likeState?.liked);
                     const isLikeLoading = Boolean(likeState?.loading);
                     const likesCount = Number(likeState?.likesCount || 0);
                     return (
                        <>
                  {/* Image Section */}
                  <div className="h-48 relative overflow-hidden">
                     <img src={provider.featuredService?.image} alt={provider.featuredService?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute top-3 right-3">
                        <button
                           className={cn(
                              "p-2 backdrop-blur-md rounded-full transition-colors",
                              isLiked ? "bg-rose-600/80 text-white hover:bg-rose-600" : "bg-slate-950/50 text-white hover:bg-slate-950"
                           )}
                           onClick={() => handleToggleProviderLike(provider.providerId)}
                           disabled={user?.role !== 'CONSUMER' || isLikeLoading}
                           title={isLiked ? 'Unlike provider' : 'Like provider'}
                        >
                           <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                     </div>
                     <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white">
                        From Ksh {provider.minPrice}
                     </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h3 className="font-bold text-lg text-white mb-1">{provider.providerName}</h3>
                           <p className="text-sm text-slate-400 flex items-center gap-1.5">
                              {provider.uniqueCategories.join(', ')} <span className="w-1 h-1 bg-slate-600 rounded-full"></span> 2.5km away
                           </p>
                        </div>
                        <img src={provider.providerAvatar} alt={provider.providerName} className="w-10 h-10 rounded-full border-2 border-slate-800" />
                     </div>

                     <div className="flex gap-2">
                        <Button
                           variant="secondary"
                           className="flex-1 py-2 text-xs bg-slate-800/50 hover:bg-slate-800"
                           onClick={() => onMessageProvider(provider.providerId)}
                        >
                           <MessageSquare size={14} className="mr-2" /> Message
                        </Button>
                        <Button
                           variant="primary"
                           className="flex-1 py-2 text-xs"
                           onClick={() => setExpandedProviderId(prev => prev === provider.providerId ? null : provider.providerId)}
                        >
                           {expandedProviderId === provider.providerId ? 'Hide Services' : 'View Services'}
                        </Button>
                     </div>

                     <div className="border-t border-slate-800 mt-4 pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                           <Star size={16} className="text-yellow-400 fill-yellow-400" />
                           <span className="font-bold text-white">{provider.featuredService?.rating || 0}</span>
                           <span className="text-slate-500 text-sm">({provider.featuredService?.reviews || 0})</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-xs text-slate-500">{likesCount} like{likesCount === 1 ? '' : 's'}</span>
                           <span className="text-xs text-slate-500">{provider.services.length} service{provider.services.length === 1 ? '' : 's'}</span>
                        </div>
                     </div>

                     {expandedProviderId === provider.providerId && (
                        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                           {provider.services.map(service => (
                              <div key={service.id} className="flex items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-lg p-3">
                                 <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{service.title}</p>
                                    <p className="text-xs text-slate-500">{service.category} · Ksh {service.price}</p>
                                 </div>
                                 <Button
                                    variant="secondary"
                                    className="text-xs px-3"
                                    onClick={() => onSelectService(service)}
                                 >
                                    View Profile
                                 </Button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                        </>
                     );
                  })()}
               </div>
            ))}
         </div>
      </div>
   );
};
