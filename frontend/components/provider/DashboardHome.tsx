import React from 'react';
import { Card, Badge } from '../Layout';
import { TrendingUp, Users, DollarSign, Briefcase } from 'lucide-react';
import { MOCK_BOOKINGS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from '../../types';

const data = [
  { name: 'Mon', amt: 240 },
  { name: 'Tue', amt: 139 },
  { name: 'Wed', amt: 980 },
  { name: 'Thu', amt: 390 },
  { name: 'Fri', amt: 480 },
  { name: 'Sat', amt: 380 },
  { name: 'Sun', amt: 430 },
];

interface DashboardHomeProps {
  user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
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
          { label: 'Total Earnings', value: '$2,450', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Active Jobs', value: '3', icon: Briefcase, color: 'text-blue-400' },
          { label: 'Total Clients', value: '124', icon: Users, color: 'text-purple-400' },
          { label: 'Rating', value: '4.9', icon: TrendingUp, color: 'text-yellow-400' },
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Bookings</h3>
          <div className="space-y-4">
            {MOCK_BOOKINGS.slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-800 last:border-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold">
                  {b.consumerName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{b.serviceTitle}</p>
                  <p className="text-xs text-slate-500">{new Date(b.date).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};