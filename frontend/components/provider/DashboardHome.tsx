import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from '../Layout';
import { TrendingUp, Users, DollarSign, Briefcase, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Booking, Transaction } from '../../types';

interface DashboardHomeProps {
  user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        const res = await fetch('/api/bookings/my-jobs', {
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
            providerName: b.provider?.name || '',
            consumerName: b.consumer?.name || 'Client',
            date: b.date,
            status: b.status,
            price: b.price
          }));
          setBookings(mapped);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Failed to load jobs', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        const res = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const mapped: Transaction[] = data.map((t: any) => ({
            id: t._id,
            date: t.date,
            amount: t.amount,
            status: t.status,
            description: t.description,
            user: t.user?.name || user.name
          }));
          setTransactions(mapped);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Failed to load transactions', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadBookings();
    loadTransactions();
  }, [user.name]);

  const stats = useMemo(() => {
    const totalEarnings = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    const activeJobs = bookings.filter(b => b.status === 'IN_PROGRESS' || b.status === 'PENDING').length;
    const uniqueClients = new Set(bookings.map(b => b.consumerId).filter(Boolean)).size;
    return { totalEarnings, activeJobs, uniqueClients };
  }, [bookings, transactions]);

  const chartData = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const base = days.map(d => ({ name: d, amt: 0 }));
    transactions
      .filter(t => t.status === 'COMPLETED')
      .forEach(t => {
        const d = new Date(t.date);
        base[d.getDay()].amt += t.amount;
      });
    return base;
  }, [transactions]);

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3),
    [bookings]
  );

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-400">Here's how your business is performing today.</p>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earnings', value: loadingTransactions ? '...' : `$${stats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Active Jobs', value: loadingBookings ? '...' : stats.activeJobs.toString(), icon: Briefcase, color: 'text-blue-400' },
          { label: 'Total Clients', value: loadingBookings ? '...' : stats.uniqueClients.toString(), icon: Users, color: 'text-purple-400' },
          { label: 'Rating', value: user.verified ? '4.9' : '—', icon: TrendingUp, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <Card key={i} className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-slate-800 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Weekly Earnings</h3>
          {loadingTransactions ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={18} /> Loading earnings...
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="amt" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Bookings</h3>
          {loadingBookings ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={18} /> Loading bookings...
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">No bookings yet.</div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-start gap-3 pb-3 border-b border-slate-800 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                    {b.consumerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{b.serviceTitle}</p>
                    <p className="text-xs text-slate-500">{new Date(b.date).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : b.status === 'IN_PROGRESS' ? 'warning' : 'default'}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
