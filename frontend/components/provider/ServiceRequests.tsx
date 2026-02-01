import React from 'react';
import { Card, Badge, Button } from '../Layout';
import { Calendar, DollarSign, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { MOCK_BOOKINGS } from '../../constants';

interface ServiceRequestsProps {
  onMessageUser: (userId: string) => void;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ onMessageUser }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white">Incoming Requests</h2>
      <div className="space-y-4">
        {MOCK_BOOKINGS.map(booking => (
          <Card key={booking.id} className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-500 uppercase">#{booking.id}</span>
                <Badge variant={booking.status === 'PENDING' ? 'warning' : 'default'}>{booking.status}</Badge>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{booking.serviceTitle}</h3>
              <p className="text-slate-400 text-sm mb-3">Requested by <span className="text-white font-medium">{booking.consumerName}</span></p>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"><DollarSign size={12} /> ${booking.price}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="secondary"
                onClick={() => onMessageUser(booking.consumerId)}
              >
                <MessageSquare size={16} className="mr-2" /> Message
              </Button>
              {booking.status === 'PENDING' && (
                <>
                  <Button variant="danger" className="flex-1 md:flex-none"><XCircle size={16} className="mr-2" /> Decline</Button>
                  <Button variant="primary" className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"><CheckCircle size={16} className="mr-2" /> Accept</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};