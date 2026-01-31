import React from 'react';
import { Card, Button, Badge, cn } from '../Layout';
import { MOCK_BOOKINGS, MOCK_SERVICES, MOCK_PAYMENTS, MOCK_FAVORITES } from '../../constants';
import { Plus } from 'lucide-react';
import { User } from '../../types';

interface DashboardHomeProps {
  user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-400">Here's an overview of your activity on localLink.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} /> New Service Request
        </Button>
      </div>

      {/* Active Requests */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Active Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_BOOKINGS.map((booking) => {
            // Find matching service image for better mock data display
            const serviceImage = MOCK_SERVICES.find(s => s.id === booking.serviceId)?.image || 'https://picsum.photos/400/300';

            const statusColors = {
              'IN_PROGRESS': 'bg-amber-600/20 text-amber-500 border-amber-600/20',
              'PENDING': 'bg-yellow-600/20 text-yellow-500 border-yellow-600/20',
              'COMPLETED': 'bg-emerald-600/20 text-emerald-500 border-emerald-600/20',
              'CANCELLED': 'bg-red-600/20 text-red-500 border-red-600/20'
            };

            const statusLabel = {
              'IN_PROGRESS': 'In Progress',
              'PENDING': 'Pending',
              'COMPLETED': 'Completed',
              'CANCELLED': 'Cancelled'
            };

            return (
              <Card key={booking.id} noPadding className="flex flex-col h-full bg-slate-900 border-slate-800">
                <div className="relative h-48">
                  <img src={serviceImage} alt={booking.serviceTitle} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                </div>
                <div className="p-5 flex-1 flex flex-col relative -mt-12">
                  <span className={cn("self-start px-3 py-1 rounded-full text-xs font-semibold border mb-3 backdrop-blur-md", statusColors[booking.status])}>
                    {statusLabel[booking.status]}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-1">{booking.serviceTitle}</h3>
                  <p className="text-slate-400 text-sm mb-6">{booking.providerName}</p>
                  <Button variant="secondary" className="w-full mt-auto bg-slate-800/80 hover:bg-slate-700">View Details</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Payments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Payments</h2>
            <button className="text-sm text-blue-500 hover:text-blue-400">View All Transactions</button>
          </div>
          <Card noPadding className="overflow-hidden">
            <div className="w-full text-left">
              <div className="bg-slate-950/30 text-slate-500 text-xs font-bold uppercase py-3 px-6 flex">
                <div className="w-1/4">Date</div>
                <div className="w-1/4">Provider</div>
                <div className="w-1/4">Service</div>
                <div className="w-1/4 text-right">Amount</div>
              </div>
              <div className="divide-y divide-slate-800">
                {MOCK_PAYMENTS.map((payment) => (
                  <div key={payment.id} className="py-4 px-6 flex items-center hover:bg-slate-800/30 transition-colors">
                    <div className="w-1/4 text-slate-300 text-sm">{payment.date}</div>
                    <div className="w-1/4 text-white font-medium text-sm">{payment.provider}</div>
                    <div className="w-1/4 text-slate-400 text-sm">{payment.service}</div>
                    <div className="w-1/4 text-right text-white font-mono text-sm">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Favorite Providers */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Favorite Providers</h2>
          <div className="space-y-4">
            {MOCK_FAVORITES.map((fav) => (
              <Card key={fav.id} className="flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer p-4">
                <img src={fav.avatar} alt={fav.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-white text-base">{fav.name}</h4>
                  <p className="text-slate-400 text-sm">{fav.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};