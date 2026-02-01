import React from 'react';
import { Card, Badge, Button } from '../Layout';
import { MOCK_BOOKINGS } from '../../constants';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { User } from '../../types';

interface ServiceRequestsProps {
  onMessageProvider: (userId: string) => void;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ onMessageProvider }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h3 className="text-2xl font-bold mb-6">Service Requests</h3>
      <div className="grid gap-4">
        {MOCK_BOOKINGS.map((booking) => (
          <Card key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-700 transition-all">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg text-white">{booking.serviceTitle}</h4>
                  <Badge variant={
                    booking.status === 'COMPLETED' ? 'success' :
                      booking.status === 'IN_PROGRESS' ? 'warning' : 'default'
                  }>
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
    </div>
  );
};