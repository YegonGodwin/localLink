import React, { useState, useEffect } from 'react';
import { Service, User } from '../../types';
import { Button, Modal } from '../Layout';
import { Check } from 'lucide-react';

import { DashboardHome } from './DashboardHome';
import { ExploreServices } from './ExploreServices';
import { ServiceRequests } from './ServiceRequests';
import { ProviderProfile } from './ProviderProfile';
import { Payments } from './Payments';

interface ConsumerProps {
  user: User;
  currentView: string;
  onMessageProvider: (userId: string) => void;
}

export const ConsumerDashboard: React.FC<ConsumerProps> = ({ user, currentView, onMessageProvider }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingCart, setBookingCart] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Clear selected service when navigating to a different main view, 
  // unless we are in 'explore' which owns the profile view.
  useEffect(() => {
    if (currentView !== 'explore') {
      setSelectedService(null);
    }
  }, [currentView]);

  const toggleCartItem = (serviceId: string) => {
    setBookingCart(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handlePaymentSuccess = () => {
    setBookingCart([]);
    setShowBookingModal(false);
    setSelectedService(null);
    setCurrentView('requests');
  };

  // View Routing Logic
  if (currentView === 'dashboard') {
    return <DashboardHome user={user} />;
  }

  if (currentView === 'requests') {
    return <ServiceRequests onMessageProvider={onMessageProvider} />;
  }

  if (currentView === 'payments') {
    return <Payments />;
  }

  if (currentView === 'explore') {
    if (selectedService) {
      return (
        <ProviderProfile
          service={selectedService}
          onBack={() => { setSelectedService(null); setBookingCart([]); }}
          bookingCart={bookingCart}
          toggleCartItem={toggleCartItem}
          showBookingModal={showBookingModal}
          setShowBookingModal={setShowBookingModal}
          onPaymentSuccess={handlePaymentSuccess}
          onMessageProvider={onMessageProvider}
        />
      );
    }
    return <ExploreServices user={user} onSelectService={setSelectedService} onMessageProvider={onMessageProvider} />;
  }

  // Fallback
  return <div>Unknown View</div>;
};
