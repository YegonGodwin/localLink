import React, { useState } from 'react';
import { Card, Button, cn } from '../Layout';
import { 
  ChevronRight, Home, UploadCloud, X, Bold, Italic, List, 
  AlignLeft, DollarSign, Tag, Clock, Calendar, CheckSquare, Square
} from 'lucide-react';

interface CreateServiceProps {
  onCancel: () => void;
}

export const CreateService: React.FC<CreateServiceProps> = ({ onCancel }) => {
  const [pricingType, setPricingType] = useState<'hourly' | 'fixed' | 'daily'>('hourly');
  const [availability, setAvailability] = useState({
    mon: true, tue: true, wed: true, thu: false, fri: false, sat: false, sun: false
  });

  const toggleDay = (day: keyof typeof availability) => {
    setAvailability(prev => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
             <Home size={14} /> Home
          </div>
          <ChevronRight size={14} />
          <span className="hover:text-white transition-colors cursor-pointer" onClick={onCancel}>Services</span>
          <ChevronRight size={14} />
          <span className="text-white font-medium">Create New</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Add New Service</h1>
            <p className="text-slate-400">Fill in the details to list your service on LocalLink and start getting booked.</p>
          </div>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      {/* Service Details Section */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
            <AlignLeft size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Service Details</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Service Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g., Professional House Cleaning"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
            />
            <p className="text-xs text-slate-500">Make it clear and descriptive.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Category <span className="text-red-500">*</span></label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer">
                <option value="">Select a category</option>
                <option value="plumbing">Plumbing</option>
                <option value="cleaning">Cleaning</option>
                <option value="gardening">Gardening</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Subcategory</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-400 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                <option value="">Select category first</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Description <span className="text-red-500">*</span></label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <div className="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-900/50">
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Bold size={16} /></button>
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Italic size={16} /></button>
                <div className="w-px h-4 bg-slate-800 mx-1"></div>
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><List size={16} /></button>
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><AlignLeft size={16} /></button>
              </div>
              <textarea 
                rows={6}
                placeholder="Describe your service in detail..."
                className="w-full bg-transparent p-4 text-white outline-none resize-none placeholder-slate-600"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Visuals Section */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
            <UploadCloud size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Visuals</h3>
        </div>

        <div className="space-y-4">
           <label className="text-sm font-medium text-slate-300">Service Images (Max 5)</label>
           <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-950/30 hover:bg-slate-950/50 hover:border-blue-500/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <UploadCloud size={24} className="text-blue-500" />
              </div>
              <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-xs">SVG, PNG, JPG or GIF (max. 800×400px)</p>
           </div>

           <div className="flex gap-4 overflow-x-auto pb-2">
             {/* Mock Uploaded Images */}
             {[1, 2].map(i => (
               <div key={i} className="relative w-32 h-24 rounded-lg overflow-hidden border border-slate-800 group">
                 <img src={`https://picsum.photos/seed/${i + 100}/200/150`} className="w-full h-full object-cover" />
                 <button className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                   <X size={12} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </Card>

      {/* Pricing & Skills Section */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
            <DollarSign size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Pricing & Skills</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-300">Pricing Structure</label>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               {[
                 { id: 'hourly', label: 'Hourly Rate', icon: Clock },
                 { id: 'fixed', label: 'Fixed Price', icon: Tag },
                 { id: 'daily', label: 'Daily Rate', icon: Calendar }
               ].map((type) => (
                 <button 
                   key={type.id}
                   onClick={() => setPricingType(type.id as any)}
                   className={cn(
                     "flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all",
                     pricingType === type.id 
                       ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                       : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                   )}
                 >
                    <type.icon size={20} />
                    <span className="font-medium">{type.label}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">Amount</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-16 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">USD</span>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tags / Skills</label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 flex items-center flex-wrap gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs border border-blue-500/20 flex items-center gap-1">
                Deep Cleaning <button className="hover:text-blue-300"><X size={10}/></button>
              </span>
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs border border-blue-500/20 flex items-center gap-1">
                Sanitization <button className="hover:text-blue-300"><X size={10}/></button>
              </span>
              <input 
                 className="flex-1 bg-transparent text-sm text-white outline-none min-w-[120px] px-1 py-1"
                 placeholder="Type and press Enter"
              />
            </div>
            <p className="text-xs text-slate-500">Add keywords to help customers find your service.</p>
          </div>
        </div>
      </Card>

      {/* Availability Section */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
            <Calendar size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Availability</h3>
        </div>

        <div className="space-y-1 divide-y divide-slate-800">
           {Object.entries(availability).map(([day, isActive]) => (
             <div key={day} className="flex flex-col md:flex-row md:items-center py-4 gap-4 md:gap-0">
               <div className="w-40 flex items-center gap-3">
                 <button 
                   onClick={() => toggleDay(day as any)}
                   className={cn("transition-colors", isActive ? "text-blue-500" : "text-slate-600")}
                 >
                    {isActive ? <CheckSquare size={20} /> : <Square size={20} />}
                 </button>
                 <span className="capitalize font-medium text-slate-300">
                    {day === 'wed' ? 'Wednesday' : day === 'thu' ? 'Thursday' : day + 'day'}
                 </span>
               </div>
               
               <div className="flex-1 flex items-center gap-4">
                 {isActive ? (
                   <>
                     <div className="relative">
                        <input type="time" defaultValue="09:00" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                     </div>
                     <span className="text-slate-500 text-sm">to</span>
                     <div className="relative">
                        <input type="time" defaultValue="17:00" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                     </div>
                   </>
                 ) : (
                   <span className="text-slate-600 text-sm italic">Not available</span>
                 )}
               </div>
             </div>
           ))}
        </div>
      </Card>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800 flex items-center justify-between z-10">
         <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium px-4 py-2" onClick={onCancel}>
            <X size={16} /> Discard
         </button>
         <div className="flex items-center gap-3">
            <Button variant="secondary">Save Draft</Button>
            <Button className="flex items-center gap-2">
               <UploadCloud size={16} /> Publish Service
            </Button>
         </div>
      </div>
    </div>
  );
};