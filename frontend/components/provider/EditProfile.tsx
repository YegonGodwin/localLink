import React, { useState, useRef } from 'react';
import { Card, Button, cn, Badge } from '../Layout';
import { Service, User } from '../../types';
import {
  assertProfileMediaWithinLimit,
  optimizeProfileImage
} from '../../utils/profileImages';
import {
  Camera, UploadCloud, MapPin, Globe, Mail, Phone,
  User as UserIcon, Briefcase, CheckCircle, Save, X,
  ExternalLink, ShieldCheck, CreditCard, ChevronRight
} from 'lucide-react';

interface EditProfileProps {
  user: User;
  onPreview: (service: Service) => void;
  onUpdate: (updatedUser: User) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onPreview, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Initialize state from the user prop
  const [formData, setFormData] = useState({
    name: user.name || '',
    tagline: user.tagline || '',
    bio: user.bio || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    website: user.website || '',
    avatar: user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
    coverImage: user.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80',
    location: user.location || '',
    category: user.category || 'Plumbing'
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      assertProfileMediaWithinLimit({
        avatar: formData.avatar,
        coverImage: formData.coverImage
      });

      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json().catch(() => ({ message: 'Failed to update profile' }));

      if (!res.ok) {
        alert(data.message || 'Failed to update profile');
        return;
      }

      // Map backend response to frontend User type consistently
      const updatedUser: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        location: data.location,
        status: data.status,
        verified: data.verified,
        tagline: data.tagline,
        bio: data.bio,
        phone: data.phone,
        address: data.address,
        category: data.category,
        website: data.website,
        coverImage: data.coverImage,
        portfolio: data.portfolio
      };

      // Update local storage and parent state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdate(updatedUser);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      alert(error instanceof Error ? error.message : 'Network error during profile update');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Map current form data to a Service object for the ProviderProfile component
    const previewService: Service = {
      id: 'preview-mode',
      providerId: user.id,
      providerName: formData.name,
      providerAvatar: formData.avatar,
      title: formData.tagline,
      description: formData.bio,
      category: formData.category,
      price: 150, // Example price for preview
      rating: 4.9,
      reviews: 128,
      image: formData.coverImage
    };
    onPreview(previewService);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const optimizedImage = await optimizeProfileImage(file, field);
      const nextFormData = { ...formData, [field]: optimizedImage };

      assertProfileMediaWithinLimit({
        avatar: nextFormData.avatar,
        coverImage: nextFormData.coverImage
      });

      setFormData(nextFormData);
    } catch (error) {
      console.error(`${field} upload error:`, error);
      alert(error instanceof Error ? error.message : 'Failed to process the selected image.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={coverInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, 'coverImage')}
      />
      <input
        type="file"
        ref={avatarInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, 'avatar')}
      />

      {/* Header with Cover & Avatar */}
      <div className="relative">
        <div
          className="h-64 md:h-80 w-full rounded-2xl overflow-hidden relative group bg-slate-800 border border-slate-800 shadow-xl cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
        >
          <img
            src={formData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              className="bg-slate-900/80 backdrop-blur-md border-slate-600 hover:bg-slate-800 shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                coverInputRef.current?.click();
              }}
            >
              <Camera size={18} className="mr-2" /> Change Cover Photo
            </Button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        </div>

        {/* Profile Avatar Area */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-950 bg-slate-800 shadow-2xl relative">
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="mb-4 hidden md:block">
            <h1 className="text-2xl font-bold text-white mb-1">{formData.name || 'Your Business'}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="flex items-center gap-1">
                <ShieldCheck size={12} /> Verified Pro
              </Badge>
              <span className="text-slate-400 text-sm">Member since {new Date(user.id.startsWith('new_') ? Date.now() : parseInt(user.id.split('_')[1] || Date.now().toString())).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-24 right-8 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 z-50">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="font-bold">Settings Saved!</p>
            <p className="text-xs opacity-90">Your profile has been updated successfully.</p>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <div className="pt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Business Identity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Briefcase size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Business Identity</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
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
                <label className="text-sm font-medium text-slate-300">Professional Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="e.g. Expert Residential & Commercial Solutions"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Business Bio</label>
                <textarea
                  rows={6}
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                />
                <p className="text-xs text-slate-500">Tell your customers why you're the best choice for the job.</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Contact & Online Presence</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Public Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Profile Summary & Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20 sticky top-8">
            <h3 className="font-bold text-white mb-4">Profile Completeness</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Step 3 of 4</span>
                <span className="text-blue-400 font-bold">85%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle size={14} /> Identity Verified
              </li>
              <li className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle size={14} /> Services Listed
              </li>
              <li className="flex items-center gap-2 text-xs text-amber-400">
                <div className="w-3.5 h-3.5 rounded-full border border-amber-400/50 flex items-center justify-center text-[8px] font-bold">!</div>
                Portfolio could be improved
              </li>
            </ul>

            <div className="space-y-3">
              <Button
                className="w-full py-4 shadow-xl"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <UploadCloud className="mr-2 animate-bounce" size={20} /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={20} /> Save Changes
                  </>
                )}
              </Button>
              <Button variant="secondary" className="w-full py-3" onClick={handlePreview}>
                <ExternalLink className="mr-2" size={18} /> View Public Profile
              </Button>
            </div>
          </Card>

          <Card className="border-slate-800/50">
            <h4 className="font-bold text-sm text-white mb-4">Trust & Verification</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <ShieldCheck size={20} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-white">ID Verification</p>
                  <p className="text-[10px] text-slate-500">Completed on Dec 12, 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <CreditCard size={20} className="text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-white">Payout Method</p>
                  <p className="text-[10px] text-slate-500">M-Pesa Ending in ...678</p>
                </div>
                <button className="ml-auto text-[10px] text-blue-500 hover:underline">Edit</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
