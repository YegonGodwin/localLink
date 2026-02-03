import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../Layout';
import { Calendar, Clock, MessageSquare, Loader2, RefreshCcw } from 'lucide-react';
import { Booking } from '../../types';

interface ServiceRequestsProps {
  onMessageProvider: (userId: string) => void;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ onMessageProvider }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const mapped: Booking[] = data.map((b: any) => ({
          id: b._id,
          serviceId: b.service?._id || '',
          consumerId: b.consumer?._id || '',
          providerId: b.provider?._id || '',
          serviceTitle: b.service?.title || 'Service',
          providerName: b.provider?.name || 'Provider',
          consumerName: b.consumer?.name || 'You',
          date: b.date,
          status: b.status,
          price: b.price
        }));
        setBookings(mapped);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const renderStatus = (status: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'IN_PROGRESS') return 'warning';
    if (status === 'CANCELLED') return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold mb-2">Service Requests</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setRefreshing(true); fetchBookings(); }}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCcw size={14} className="mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} />
          Loading your requests...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
          No service requests yet. Book a provider to see it here.
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-700 transition-all">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg text-white">{booking.serviceTitle}</h4>
                    <Badge variant={renderStatus(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-1">Provider: <span className="text-slate-200">{booking.providerName}</span></p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:self-center self-end">
                <span className="font-bold text-lg">${booking.price}</span>
                <Button
                  variant="secondary"
                  className="text-sm flex items-center gap-2"
                  onClick={() => onMessageProvider(booking.providerId)}
                >
                  <MessageSquare size={14} /> Message
                </Button>
                <Button variant="secondary" className="text-sm">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
