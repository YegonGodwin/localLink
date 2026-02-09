import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, cn } from '../Layout';
import { Search, Plus, MoreVertical, Edit2, Trash2, Filter, Store, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Service, User } from '../../types';

interface MyServicesProps {
   user: User;
   onCreateClick: () => void;
}

export const MyServices: React.FC<MyServicesProps> = ({ user, onCreateClick }) => {
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 6;

   const fetchServices = async () => {
      try {
         setLoading(true);
         const res = await fetch(`/api/services/provider/${user.id}`);
         const data = await res.json();
         if (res.ok) {
            const mapped = data.map((s: any): Service => ({
               id: s._id,
               providerId: s.provider?._id || user.id,
               providerName: s.provider?.name || user.name,
               providerAvatar: s.provider?.avatar || user.avatar,
               title: s.title,
               description: s.description,
               category: s.category,
               price: s.price,
               rating: s.rating ?? 0,
               reviews: s.reviews ?? 0,
               image: s.image
            }));
            setServices(mapped);
         }
      } catch (error) {
         console.error('Error fetching services:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchServices();
   }, [user.id]);

   const toggleServiceStatus = (id: string) => {
      // Backend doesn't have an explicit 'isActive' toggle yet in the model, 
      // but we can simulate it or just show real data.
      // For now, let's just keep the UI interactive.
      console.log('Toggle status for:', id);
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this service?')) return;
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`/api/services/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
         });
         if (res.ok) {
            setServices(prev => prev.filter(s => s.id !== id));
         }
      } catch (error) {
         console.error('Error deleting service:', error);
      }
   };

   // Filter items
   const filteredServices = services.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
   );

   // Pagination Logic
   const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const currentServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

   // Reset to page 1 when search changes
   useEffect(() => {
      setCurrentPage(1);
   }, [searchQuery]);

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   return (
      <div className="space-y-8 pb-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-3xl font-bold text-white mb-2">My Services</h2>
               <p className="text-slate-400">Manage your service offerings and availability</p>
            </div>
            <Button className="flex items-center gap-2 px-6" onClick={onCreateClick}>
               <Plus size={18} /> Add New Service
            </Button>
         </div>

         {/* Filters Bar */}
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
               <input
                  type="text"
                  placeholder="Search services (e.g. Plumbing, Cleaning)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="md:w-48 relative">
               <button className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white hover:border-slate-700 transition-colors">
                  <span>All Statuses</span>
                  <ChevronDown size={16} className="text-slate-500" />
               </button>
            </div>
         </div>

         {/* Services Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <p>Loading your services...</p>
               </div>
            ) : currentServices.length === 0 && searchQuery === '' ? (
               <div className="col-span-full py-20 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <Store size={48} className="text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Services Yet</h3>
                  <p className="text-slate-400 max-w-sm mb-6">You haven't listed any services. Start by creating your first service to reach local customers.</p>
                  <Button onClick={onCreateClick}>Create First Service</Button>
               </div>
            ) : currentServices.map((service) => (
               <div key={service.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col animate-in fade-in duration-300">
                  {/* Image Area */}
                  <div className="h-48 relative overflow-hidden">
                     <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>

                     {/* Price Tag */}
                     <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl">
                        <span className="text-white font-bold">Ksh.{service.price}</span>
                        <span className="text-xs text-slate-400 font-medium">/hr</span>
                     </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white">{service.title}</h3>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{service.category}</Badge>
                     </div>
                     <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                        {service.description}
                     </p>

                     {/* Footer Actions */}
                     <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                           <span className="flex items-center gap-1"><Store size={14} /> Active</span>
                        </div>

                        {/* Edit/Delete Icons */}
                        <div className="flex items-center gap-1">
                           <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                              <Edit2 size={18} />
                           </button>
                           <button
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              onClick={() => handleDelete(service.id)}
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}

            {/* Create New Service Card - Show only on the last page or if no results */}
            {(currentPage === totalPages || totalPages === 0) && (
               <button
                  onClick={onCreateClick}
                  className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px] hover:border-blue-500/50 hover:bg-blue-900/5 transition-all group text-center space-y-4 animate-in fade-in duration-300"
               >
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                     <Store size={32} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white mb-2">Create New Service</h3>
                     <p className="text-slate-400 text-sm max-w-[200px] mx-auto mb-6">
                        Expand your business by adding more service categories.
                     </p>
                     <div className="inline-flex px-4 py-2 bg-slate-800 text-blue-400 text-sm font-medium rounded-lg border border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-colors">
                        Draft a Service
                     </div>
                  </div>
               </button>
            )}
         </div>

         {/* Pagination Controls */}
         {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-slate-800/50">
               <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3"
               >
                  <ChevronLeft size={18} />
               </Button>

               <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                     <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                           "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                           currentPage === page
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                     >
                        {page}
                     </button>
                  ))}
               </div>

               <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3"
               >
                  <ChevronRight size={18} />
               </Button>
            </div>
         )}
      </div>
   );
};
