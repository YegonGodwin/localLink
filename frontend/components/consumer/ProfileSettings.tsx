import React, { useState, useRef } from 'react';
import { Card, Button, Badge } from '../Layout';
import { User } from '../../types';
import {
  assertProfileMediaWithinLimit,
  optimizeProfileImage
} from '../../utils/profileImages';
import {
  Camera, UploadCloud, MapPin, Mail,
  User as UserIcon, CheckCircle, Save
} from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
    location: user.location || ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      assertProfileMediaWithinLimit({
        avatar: formData.avatar
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

      // Map backend response to frontend User type if necessary
      const updatedUser: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        location: data.location,
        status: data.status,
        verified: data.verified
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const optimizedImage = await optimizeProfileImage(file, 'avatar');
      
      assertProfileMediaWithinLimit({
        avatar: optimizedImage
      });

      setFormData(prev => ({ ...prev, avatar: optimizedImage }));
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process the selected image.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <input
        type="file"
        ref={avatarInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-2xl relative">
            <img
              src={formData.avatar}
              alt="Profile"
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
              <Camera size={32} className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full text-white shadow-lg">
            <Camera size={16} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">{formData.name || 'Your Name'}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <Badge variant="info" className="flex items-center gap-1">
              <UserIcon size={12} /> Consumer Account
            </Badge>
            {user.verified && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle size={12} /> Verified
              </Badge>
            )}
            <span className="text-slate-400 text-sm">Member since {new Date().getFullYear()}</span>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Upload a professional photo to build trust with service providers.
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <UserIcon size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder="Nairobi, Kenya"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20">
            <h3 className="font-bold text-white mb-4">Quick Actions</h3>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
