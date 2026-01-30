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
  currentView: string;
}

export const ProviderDashboard: React.FC<ProviderProps> = ({ currentView }) => {
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
          toggleCartItem={() => {}}
          showBookingModal={false}
          setShowBookingModal={() => {}}
          onPaymentSuccess={() => {}}
        />
      );
    }
    return <EditProfile onPreview={(data) => setPreviewData(data)} />;
  }

  // Default to Dashboard
  return <DashboardHome />;
};