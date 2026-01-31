
import React, { useState } from 'react';
import { User } from '../../types';
import { Button, Card, cn } from '../Layout';
import {
   Camera, UploadCloud, ChevronRight, ChevronLeft, MapPin,
   Globe, Mail, Phone, User as UserIcon, Briefcase, CheckCircle,
   Star, Image as ImageIcon, X, Badge as BadgeIcon
} from 'lucide-react';

interface OnboardingProps {
   user: User;
   onComplete: (updatedProfile: Partial<User>) => void;
}

interface StepProps {
   formData: Partial<User>;
   updateField: (field: keyof User, value: any) => void;
}

// Simple local Badge component for the preview
// Fix: Added optional mark to children to resolve TS missing property error in JSX
const Badge = ({ children, variant, className }: { children?: React.ReactNode, variant?: string, className?: string }) => (
   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-block", className)}>
      {children}
   </span>
);

const STEPS = ['Identity', 'About & Contact', 'Portfolio', 'Review'];

// --- Step Components (Moved Outside) ---

const StepIdentity: React.FC<StepProps> = ({ formData, updateField }) => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="space-y-4">
         <label className="block text-sm font-medium text-slate-300">Profile Photo</label>
         <div className="flex items-center gap-6">
            <div className="relative group">
               <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-800 ring-2 ring-slate-700 bg-slate-800">
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                  <Camera className="text-white" size={24} />
               </button>
            </div>
            <div className="flex-1">
               <Button variant="secondary" className="mb-2">Upload New</Button>
               <p className="text-xs text-slate-500">Recommended: 400x400px. JPG, PNG or GIF.</p>
            </div>
         </div>
      </div>

      <div className="space-y-4">
         <label className="block text-sm font-medium text-slate-300">Cover Image</label>
         <div className="h-32 rounded-xl overflow-hidden relative group bg-slate-800 border border-slate-700">
            <img src={formData.coverImage} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Button variant="secondary" className="bg-slate-900/80 backdrop-blur-sm border-slate-600">
                  <UploadCloud size={16} className="mr-2" /> Change Cover
               </Button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business / Display Name <span className="text-red-400">*</span></label>
            <input
               value={formData.name}
               onChange={(e) => updateField('name', e.target.value)}
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
               placeholder="e.g. John's Electrical"
            />
         </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Category <span className="text-red-400">*</span></label>
            <select
               value={formData.category}
               onChange={(e) => updateField('category', e.target.value)}
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            >
               <option value="Plumbing">Plumbing</option>
               <option value="Cleaning">Cleaning</option>
               <option value="Electrical">Electrical</option>
               <option value="Gardening">Gardening</option>
            </select>
         </div>
      </div>
      <div className="space-y-2">
         <label className="text-sm font-medium text-slate-300">Professional Title / Tagline</label>
         <input
            value={formData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            placeholder="e.g. Expert Residential Electrician"
         />
      </div>
   </div>
);

const StepAbout: React.FC<StepProps> = ({ formData, updateField }) => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="space-y-2">
         <label className="text-sm font-medium text-slate-300">About Your Business</label>
         <textarea
            value={formData.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
            placeholder="Tell customers about your experience, values, and what makes your service special..."
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Public Email</label>
            <div className="relative">
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                  placeholder="contact@business.com"
               />
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Phone Number</label>
            <div className="relative">
               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                  placeholder="+1 (555) 000-0000"
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Location / Address</label>
            <div className="relative">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                  placeholder="City, State"
               />
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Website (Optional)</label>
            <div className="relative">
               <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                  placeholder="https://..."
               />
            </div>
         </div>
      </div>

      <div className="space-y-2">
         <label className="text-sm font-medium text-slate-300">Password <span className="text-red-400">*</span></label>
         <input
            type="password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            placeholder="••••••••"
         />
      </div>
   </div>
);

const StepPortfolio: React.FC<StepProps> = ({ formData }) => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50 hover:border-blue-500/50 hover:bg-slate-950 transition-all cursor-pointer">
         <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="text-blue-500" size={32} />
         </div>
         <h3 className="text-lg font-bold text-white mb-1">Upload Work Samples</h3>
         <p className="text-slate-500 text-sm mb-4">Showcase your best work. High quality images increase trust.</p>
         <Button variant="secondary">Select Images</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
         {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-slate-900 rounded-lg relative group overflow-hidden border border-slate-800">
               <img src={`https://picsum.photos/seed/${i + 50}/300/300`} className="w-full h-full object-cover" />
               <button className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
               </button>
            </div>
         ))}
      </div>
   </div>
);

const StepReview: React.FC = () => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 text-center py-8">
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/50">
         <CheckCircle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
      <p className="text-slate-400 max-w-md mx-auto mb-8">
         Your profile is ready to go. You can always edit these details later from your dashboard. Click "Finish" to start adding your services.
      </p>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left max-w-sm mx-auto">
         <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
               <Briefcase size={18} />
            </div>
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold">Next Step</p>
               <p className="text-sm text-white font-medium">Create your first Service Offering</p>
            </div>
         </div>
      </div>
   </div>
);

// --- Preview Component (Moved Outside) ---
const PreviewCard: React.FC<{ formData: Partial<User> }> = ({ formData }) => (
   <div className="sticky top-24">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
         <Globe size={14} /> Customer View Preview
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
         {/* Cover */}
         <div className="h-32 bg-slate-800 relative">
            {formData.coverImage && <img src={formData.coverImage} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
         </div>

         {/* Content */}
         <div className="px-6 pb-6 relative -mt-12">
            <div className="flex justify-between items-end mb-4">
               <div className="w-24 h-24 rounded-xl bg-slate-950 p-1">
                  <img src={formData.avatar} className="w-full h-full object-cover rounded-lg" />
               </div>
               <div className="mb-1 hidden md:block">
                  <Badge variant="outline" className="bg-slate-950/50 text-emerald-400 border-emerald-500/30">Verified Pro</Badge>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <h2 className="text-xl font-bold text-white">{formData.name || 'Your Business Name'}</h2>
                  <p className="text-blue-400 text-sm font-medium">{formData.tagline || 'Your Professional Title'}</p>
               </div>

               <div className="flex items-center gap-4 text-xs text-slate-400 border-y border-slate-800 py-3">
                  <div className="flex items-center gap-1 text-yellow-400">
                     <Star size={14} fill="currentColor" />
                     <span className="font-bold text-white">5.0</span>
                     <span className="text-slate-500">(0)</span>
                  </div>
                  <div className="w-px h-4 bg-slate-800"></div>
                  <div className="flex items-center gap-1">
                     <MapPin size={14} />
                     <span>{formData.address || 'Location'}</span>
                  </div>
               </div>

               <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">About</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                     {formData.bio || 'Your business description will appear here...'}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="w-full text-xs py-2 h-auto pointer-events-none">Book Now</Button>
                  <Button size="sm" variant="secondary" className="w-full text-xs py-2 h-auto pointer-events-none">Contact</Button>
               </div>
            </div>
         </div>
      </div>
   </div>
);

// --- Main Component ---
export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
   const [currentStep, setCurrentStep] = useState(0);
   const [formData, setFormData] = useState<Partial<User>>({
      name: user.name || '',
      tagline: '',
      bio: '',
      phone: '',
      address: '',
      website: '',
      category: 'Plumbing',
      password: user.password || '',
      avatar: user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80',
      portfolio: []
   });

   const handleNext = async () => {
      if (currentStep < STEPS.length - 1) {
         setCurrentStep(prev => prev + 1);
      } else {
         try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/profile', {
               method: 'PUT',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
               alert(data.message || 'Failed to update profile');
               return;
            }

            // Update local storage with the complete profile
            localStorage.setItem('user', JSON.stringify(data));
            onComplete(data);
         } catch (error) {
            console.error('Onboarding update error:', error);
            alert('Network error during onboarding');
         }
      }
   };

   const handleBack = () => {
      if (currentStep > 0) {
         setCurrentStep(prev => prev - 1);
      }
   };

   const updateField = (field: keyof User, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
   };

   return (
      <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col scroll-smooth">
         {/* Navbar */}
         <header className="px-8 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center space-x-2">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full"></div>
               </div>
               <span className="font-bold text-lg">LocalLink</span>
               <span className="px-2 py-0.5 bg-slate-800 text-xs rounded text-slate-400 ml-2">Provider Setup</span>
            </div>
            <div className="text-sm text-slate-400">
               Step {currentStep + 1} of {STEPS.length}
            </div>
         </header>

         <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid md:grid-cols-5 gap-8">
            {/* Left Column: Form */}
            <div className="md:col-span-3 space-y-8">
               <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{STEPS[currentStep]}</h1>
                  <p className="text-slate-400">Fill in the details to create your professional profile.</p>
               </div>

               {/* Step Content */}
               <div className="min-h-[400px]">
                  {currentStep === 0 && <StepIdentity formData={formData} updateField={updateField} />}
                  {currentStep === 1 && <StepAbout formData={formData} updateField={updateField} />}
                  {currentStep === 2 && <StepPortfolio formData={formData} updateField={updateField} />}
                  {currentStep === 3 && <StepReview />}
               </div>

               {/* Navigation */}
               <div className="flex justify-between pt-6 border-t border-slate-800">
                  <Button
                     variant="ghost"
                     onClick={handleBack}
                     disabled={currentStep === 0}
                     className={currentStep === 0 ? "invisible" : ""}
                  >
                     <ChevronLeft size={18} className="mr-2" /> Back
                  </Button>
                  <Button onClick={handleNext} className="px-8">
                     {currentStep === STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
                     {currentStep !== STEPS.length - 1 && <ChevronRight size={18} className="ml-2" />}
                  </Button>
               </div>
            </div>

            {/* Right Column: Preview */}
            <div className="md:col-span-2 hidden md:block">
               <PreviewCard formData={formData} />
            </div>
         </main>
      </div>
   );
};
