import React, { useState, useEffect } from 'react';
import { DashboardHome } from './DashboardHome';
import { MyServices } from './MyServices';
import { ServiceRequests } from './ServiceRequests';
import { Earnings } from './Earnings';
import { CreateService } from './CreateService';
import { EditProfile } from './EditProfile';
import { ProviderProfile } from '../consumer/ProviderProfile';
import { User, Service } from '../../types';

interface ProviderProps {
  user: User;
  currentView: string;
  onUpdate: (updatedUser: User) => void;
}

export const ProviderDashboard: React.FC<ProviderProps> = ({ user, currentView, onUpdate }) => {
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [previewData, setPreviewData] = useState<Service | null>(null);

  // Reset internal state if main view changes
  useEffect(() => {
    if (currentView !== 'services') setIsCreatingService(false);
    if (currentView !== 'profile') setPreviewData(null);
  }, [currentView]);

  if (currentView === 'services') {
    if (isCreatingService) {
      return <CreateService onCancel={() => setIsCreatingService(false)} />;
    }
    return <MyServices onCreateClick={() => setIsCreatingService(true)} />;
  }

  if (currentView === 'requests') {
    return <ServiceRequests />;
  }

  if (currentView === 'earnings') {
    return <Earnings />;
  }

  if (currentView === 'profile') {
    if (previewData) {
      return (
        <ProviderProfile
          service={previewData}
          onBack={() => setPreviewData(null)}
          bookingCart={[]}
          toggleCartItem={() => { }}
          showBookingModal={false}
          setShowBookingModal={() => { }}
          onPaymentSuccess={() => { }}
        />
      );
    }
    return <EditProfile
      user={user}
      onPreview={(data) => setPreviewData(data)}
      onUpdate={onUpdate}
    />;
  }

  // Default to Dashboard
  return <DashboardHome user={user} />;
};