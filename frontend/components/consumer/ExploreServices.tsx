import React, { useState, useEffect } from 'react';
import { Service, User } from '../../types';
import { Button, cn, Modal, Badge } from '../Layout';
import { Search, MapPin, Filter, Heart, Star, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import recommendationService from '../../services/recommendationService';

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

interface ProviderCardProps extends ProviderGroup {
   featuredService?: Service;
   minPrice: number;
   uniqueCategories: string[];
   isLiked: boolean;
   isLikeLoading: boolean;
   likesCount: number;
   onLike: (providerId: string) => void;
   onMessage: (providerId: string) => void;
   onViewServices: (provider: ProviderGroup) => void;
   userRole?: string;
}

const ProviderCardComponent: React.FC<ProviderCardProps> = ({
   providerId,
   providerName,
   providerAvatar,
   services,
   featuredService,
   minPrice,
   uniqueCategories,
   isLiked,
   isLikeLoading,
   likesCount,
   onLike,
   onMessage,
   onViewServices,
   userRole
}) => {
   return (
      <div className="group bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full">
         {/* Image Section */}
         <div className="relative h-52 overflow-hidden">
            <img 
               src={featuredService?.image || 'https://images.unsplash.com/photo-1581578731522-99c5f6087516?auto=format&fit=crop&q=80&w=800'} 
               alt={featuredService?.title} 
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
            
            <div className="absolute top-4 right-4">
               <button
                  className={cn(
                     "p-2.5 backdrop-blur-md rounded-full transition-all duration-300 transform active:scale-90",
                     isLiked ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "bg-slate-950/40 text-white hover:bg-slate-950/60 border border-white/10"
                  )}
                  onClick={(e) => {
                     e.stopPropagation();
                     onLike(providerId);
                  }}
                  disabled={userRole !== 'CONSUMER' || isLikeLoading}
               >
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className={cn(isLikeLoading && "animate-pulse")} />
               </button>
            </div>
            
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
               {uniqueCategories.slice(0, 2).map(cat => (
                  <span key={cat} className="px-2.5 py-1 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                     {cat}
                  </span>
               ))}
            </div>
         </div>

         {/* Content Section */}
         <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-4">
               <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                     {providerName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                     <MapPin size={14} className="text-slate-500" />
                     <span>Nairobi, Kenya</span>
                     <span className="w-1 h-1 bg-slate-700 rounded-full mx-1"></span>
                     <span>2.4 km</span>
                  </div>
               </div>
               <div className="relative">
                  <img 
                     src={providerAvatar} 
                     alt={providerName} 
                     className="w-12 h-12 rounded-xl object-cover border-2 border-slate-800 shadow-xl group-hover:border-blue-500/50 transition-colors" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
               </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
               <div className="flex items-center gap-1">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{featuredService?.rating || 0}</span>
                  <span className="text-slate-500 text-xs">({featuredService?.reviews || 0})</span>
               </div>
               <div className="h-4 w-px bg-slate-800"></div>
               <div className="flex items-center gap-1">
                  <Heart size={14} className="text-slate-500" />
                  <span className="text-slate-400 text-xs font-medium">{likesCount} likes</span>
               </div>
            </div>

            <div className="mt-auto space-y-4">
               <div className="flex items-center justify-between py-3 border-y border-slate-800/50">
                  <span className="text-slate-400 text-sm">Starts from</span>
                  <span className="text-white font-bold text-lg">Ksh {minPrice.toLocaleString()}</span>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Button
                     variant="secondary"
                     className="py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 group/btn"
                     onClick={() => onMessage(providerId)}
                  >
                     <MessageSquare size={14} className="mr-2 group-hover/btn:scale-110 transition-transform" /> 
                     Chat
                  </Button>
                  <Button
                     variant="primary"
                     className="py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/20 group/btn"
                     onClick={() => onViewServices({ providerId, providerName, providerAvatar, services })}
                  >
                     Services
                     <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
               </div>
            </div>
         </div>
      </div>
   );
};

export const ExploreServices: React.FC<ExploreServicesProps> = ({ user, onSelectService, onMessageProvider }) => {
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [location, setLocation] = useState(user?.location || 'Nairobi, Kenya');
   const [isLocating, setIsLocating] = useState(false);
   const [selectedProvider, setSelectedProvider] = useState<ProviderGroup | null>(null);
   const [providerLikes, setProviderLikes] = useState<Record<string, { liked: boolean; likesCount: number; loading: boolean }>>({});
   const [selectedCategory, setSelectedCategory] = useState('All');

   const fetchServices = async () => {
      try {
         setLoading(true);

         // Try recommendation API first (requires auth token)
         const token = localStorage.getItem('token');
         if (token) {
            try {
               const recResult = await recommendationService.getRecommendations(20);
               if (recResult.success && recResult.data.length > 0) {
                  const mappedServices = recResult.data.map((s: any) => ({
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
                  return;
               }
            } catch {
               // recommendation service unavailable — fall through to plain fetch
            }
         }

         // Fallback: plain service listing
         const res = await fetch('/api/services');
         const data = await res.json();
         if (res.ok) {
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
         if (user?.role !== 'CONSUMER' || services.length === 0) return;

         const token = localStorage.getItem('token');
         if (!token) return;

         const providerIds = Array.from(new Set(services.map(s => s.providerId).filter(Boolean)));
         
         try {
            const results: { providerId: string; liked: boolean; likesCount: number }[] = await Promise.all(
               providerIds.map(async (providerId: string) => {
                  const res = await fetch(`/api/users/providers/${providerId}/like-status`, {
                     headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) return { providerId, liked: false, likesCount: 0 };
                  const data = await res.json();
                  return { providerId, liked: !!data.liked, likesCount: data.likesCount || 0 };
               })
            );

            const nextLikes: Record<string, { liked: boolean; likesCount: number; loading: boolean }> = {};
            results.forEach(r => {
               nextLikes[r.providerId] = { liked: r.liked, likesCount: r.likesCount, loading: false };
            });
            setProviderLikes(nextLikes);
         } catch (error) {
            console.error('Error loading provider likes:', error);
         }
      };

      loadProviderLikeStatuses();
   }, [services, user?.role]);

   const handleToggleProviderLike = async (providerId: string) => {
      if (user?.role !== 'CONSUMER') return;
      const token = localStorage.getItem('token');
      if (!token) return;

      setProviderLikes(prev => ({
         ...prev,
         [providerId]: { ...prev[providerId], loading: true }
      }));

      try {
         const res = await fetch(`/api/users/providers/${providerId}/like`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
         });
         const data = await res.json();
         if (res.ok) {
            setProviderLikes(prev => ({
               ...prev,
               [providerId]: { liked: !!data.liked, likesCount: data.likesCount, loading: false }
            }));
         }
      } catch (error) {
         console.error('Error toggling like:', error);
         setProviderLikes(prev => ({
            ...prev,
            [providerId]: { ...prev[providerId], loading: false }
         }));
      }
   };

   const filteredServices = services.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
   });

   const providersMap = filteredServices.reduce<Record<string, ProviderGroup>>((acc, service) => {
      const providerId = service.providerId;
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

   const providerCards = Object.values(providersMap).map((provider: ProviderGroup) => {
      const minPrice = Math.min(...provider.services.map(s => s.price));
      const uniqueCategories = Array.from(new Set(provider.services.map(s => s.category)));
      const featuredService = provider.services[0];
      return { ...provider, minPrice, uniqueCategories, featuredService };
   });

   return (
      <div className="space-y-10 pb-20">
         {/* Hero Section */}
         <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
               <Badge variant="info" className="mb-4 uppercase tracking-widest font-bold px-4 py-1.5">Marketplace</Badge>
               <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                  Find the <span className="text-blue-500">Perfect Professional</span> for Your Needs
               </h1>
               <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Connect with trusted experts, read verified reviews, and book services instantly in your neighborhood.
               </p>

               {/* Integrated Search Bar */}
               <div className="flex flex-col md:flex-row bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl">
                  <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-800 py-2">
                     <Search className="text-blue-500 mr-3" size={22} />
                     <input
                        type="text"
                        placeholder="What service do you need?"
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 outline-none font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
                  <div className="flex-1 flex items-center px-4 py-2">
                     <MapPin className={cn("text-slate-500 mr-3", isLocating && "animate-pulse text-blue-500")} size={22} />
                     <input
                        type="text"
                        placeholder="Location"
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 outline-none font-medium"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                     />
                  </div>
                  <Button className="h-auto rounded-xl px-10 py-4 font-bold text-base shadow-lg shadow-blue-600/20">
                     Search
                  </Button>
               </div>
            </div>
         </div>

         {/* Filter Section */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-900 -mx-8 px-8">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
               {['All', 'Plumbing', 'Cleaning', 'Electrical', 'Gardening', 'Moving', 'Painting'].map((cat) => (
                  <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={cn(
                        "px-6 py-2.5 rounded-xl border text-sm font-bold whitespace-nowrap transition-all duration-300",
                        selectedCategory === cat 
                           ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30" 
                           : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                     )}
                  >
                     {cat}
                  </button>
               ))}
            </div>
            
            <div className="flex items-center gap-4">
               <span className="text-slate-500 text-sm font-medium">
                  Sorted by: <span className="text-white">Recommended</span>
               </span>
               <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <Filter size={18} />
               </button>
            </div>
         </div>

         {/* Results Header */}
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
               Available Providers <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">
                  {providerCards.length}
               </span>
            </h2>
         </div>

         {/* Provider Cards Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && (
               ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6'].map((key) => (
                  <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl h-[450px] animate-pulse"></div>
               ))
            )}
            {!loading && providerCards.length === 0 && (
               <div className="col-span-full py-32 bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                     <Search size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No matching providers</h3>
                  <p className="text-slate-400 max-w-sm mb-8">We couldn't find any professionals matching your current filters. Try broadening your search.</p>
                  <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                     Clear all filters
                  </Button>
               </div>
            )}
            {!loading && providerCards.length > 0 && providerCards.map((provider) => (
               <ProviderCardComponent
                  key={provider.providerId}
                  {...provider}
                  isLiked={providerLikes[provider.providerId]?.liked || false}
                  isLikeLoading={providerLikes[provider.providerId]?.loading || false}
                  likesCount={providerLikes[provider.providerId]?.likesCount || 0}
                  onLike={handleToggleProviderLike}
                  onMessage={onMessageProvider}
                  onViewServices={(p) => setSelectedProvider(p)}
                  userRole={user?.role}
               />
            ))}
         </div>

         {/* Services Modal */}
         <Modal
            isOpen={!!selectedProvider}
            onClose={() => setSelectedProvider(null)}
            title={`Services by ${selectedProvider?.providerName}`}
         >
            <div className="space-y-6 max-h-[70vh] pr-2">
               <div className="flex items-center gap-4 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl mb-4">
                  <img src={selectedProvider?.providerAvatar} className="w-12 h-12 rounded-full border-2 border-blue-500/30" alt="" />
                  <div>
                     <p className="text-white font-bold">{selectedProvider?.providerName}</p>
                     <p className="text-xs text-blue-400">Verified Professional</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-slate-950/50 rounded-lg">
                     <Star size={14} className="text-amber-400 fill-amber-400" />
                     <span className="text-sm font-bold text-white">4.9</span>
                  </div>
               </div>

               <div className="space-y-3">
                  {selectedProvider?.services.map(service => (
                     <div key={service.id} className="group flex items-center justify-between gap-4 bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-bold text-white truncate">{service.title}</h4>
                              <Badge variant="outline" className="text-[10px] py-0">{service.category}</Badge>
                           </div>
                           <p className="text-sm text-slate-400 line-clamp-1 mb-2">{service.description}</p>
                           <div className="text-blue-500 font-bold text-lg flex items-center gap-1">
                              <span className="text-xs text-slate-500 font-normal">Starting at</span>
                              Ksh {service.price.toLocaleString()}
                           </div>
                        </div>
                        <Button
                           className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-bold shadow-lg shadow-blue-600/20"
                           onClick={() => {
                              onSelectService(service);
                              setSelectedProvider(null);
                           }}
                        >
                           Book
                        </Button>
                     </div>
                  ))}
               </div>

               <div className="pt-4 flex justify-center">
                  <button 
                     className="text-slate-500 hover:text-blue-400 text-sm flex items-center gap-2 transition-colors font-medium"
                     onClick={() => {
                        // Logic to go to full profile
                        setSelectedProvider(null);
                     }}
                  >
                     View full provider profile <ExternalLink size={14} />
                  </button>
               </div>
            </div>
         </Modal>
      </div>
   );
};
