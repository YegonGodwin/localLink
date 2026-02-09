import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, cn } from '../Layout';
import { Plus, Loader2 } from 'lucide-react';
import { User, Booking, Transaction } from '../../types';

interface DashboardHomeProps {
  user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
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
        console.error('Failed to load bookings', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    const loadPayments = async (signal?: AbortSignal) => {
      try {
        setLoadingPayments(true);
        setPaymentsError(null);
        const res = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });
        const data = await res.json();
        if (signal && signal.aborted) return;
        if (res.ok && Array.isArray(data)) {
          const mapped: Transaction[] = data.map((t: any) => ({
            id: t._id,
            date: t.date || t.createdAt || new Date().toISOString(),
            amount: t.amount,
            status: t.status,
            description: t.booking?.service?.title || t.description || 'No description',
            user: t.user?.name || user.name
          }));
          const successful = mapped.filter((t) => t.status === 'COMPLETED');
          if (!signal || !signal.aborted) setPayments(successful);
        } else {
          if (!signal || !signal.aborted) {
            setPayments([]);
            setPaymentsError('Unable to load payments.');
          }
        }
      } catch (error) {
        if (signal && signal.aborted) return;
        console.error('Failed to load payments', error);
        if (!signal || !signal.aborted) setPaymentsError('Unable to load payments.');
      } finally {
        if (!signal || !signal.aborted) setLoadingPayments(false);
      }
    };

    loadBookings();
    const controller = new AbortController();
    loadPayments(controller.signal);
    const paymentsIntervalId = setInterval(() => loadPayments(controller.signal), 30000);
    return () => {
      controller.abort();
      clearInterval(paymentsIntervalId);
    };
  }, [user.name]);

  const activeBookings = useMemo(
    () => bookings.filter(b => b.status === 'IN_PROGRESS' || b.status === 'PENDING'),
    [bookings]
  );

  const favoriteProviders = useMemo(() => {
    const map = new Map<string, { name: string; id: string; count: number }>();
    bookings.forEach(b => {
      if (b.providerId) {
        const current = map.get(b.providerId) || { name: b.providerName, id: b.providerId, count: 0 };
        current.count += 1;
        map.set(b.providerId, current);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [bookings]);

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
          {loadingBookings ? (
            <div className="col-span-full flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={18} /> Loading your requests...
            </div>
          ) : activeBookings.length === 0 ? (
            <Card className="col-span-full text-slate-400 border-dashed border-slate-800">
              You have no active requests. Explore services to book a provider.
            </Card>
          ) : (
            activeBookings.map((booking) => {
              const statusColors: Record<Booking['status'], string> = {
                'IN_PROGRESS': 'bg-amber-600/20 text-amber-500 border-amber-600/20',
                'PENDING': 'bg-yellow-600/20 text-yellow-500 border-yellow-600/20',
                'COMPLETED': 'bg-emerald-600/20 text-emerald-500 border-emerald-600/20',
                'CANCELLED': 'bg-red-600/20 text-red-500 border-red-600/20'
              };

              const statusLabel: Record<Booking['status'], string> = {
                'IN_PROGRESS': 'In Progress',
                'PENDING': 'Pending',
                'COMPLETED': 'Completed',
                'CANCELLED': 'Cancelled'
              };

              return (
                <Card key={booking.id} noPadding className="flex flex-col h-full bg-slate-900 border-slate-800">
                  <div className="relative h-48">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-sm">
                      {booking.serviceTitle}
                    </div>
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
            })
          )}
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
              {loadingPayments ? (
                <div className="p-4 text-slate-400 flex items-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={18} /> Loading payments...
                </div>
              ) : paymentsError ? (
                <div className="p-4 text-red-400">{paymentsError}</div>
              ) : payments.length === 0 ? (
                <div className="p-4 text-slate-500">No payments recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {payments.slice(0, 6).map((payment) => (
                    <div key={payment.id} className="py-4 px-6 flex items-center hover:bg-slate-800/30 transition-colors">
                      <div className="w-1/4 text-slate-300 text-sm">{new Date(payment.date).toLocaleDateString()}</div>
                      <div className="w-1/4 text-white font-medium text-sm">{payment.user}</div>
                      <div className="w-1/4 text-slate-400 text-sm">{payment.description}</div>
                      <div className="w-1/4 text-right text-white font-mono text-sm">Ksh.{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Favorite Providers */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Favorite Providers</h2>
          {favoriteProviders.length === 0 ? (
            <Card className="text-slate-500">Book providers to see them highlighted here.</Card>
          ) : (
            <div className="space-y-4">
              {favoriteProviders.map((fav) => (
                <Card key={fav.id} className="flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-semibold">
                    {fav.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{fav.name}</h4>
                    <p className="text-slate-400 text-sm">Booked {fav.count} time{fav.count > 1 ? 's' : ''}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
