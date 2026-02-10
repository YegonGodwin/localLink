import React, { useEffect, useMemo, useState } from 'react';
import { Card, cn } from '../Layout';
import { ArrowUpRight, DollarSign, Loader2, UserCheck, AlertTriangle } from 'lucide-react';

interface OverviewTransaction {
  id: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  user: string;
}

interface OverviewData {
  totalUsers: number;
  activeUsers: number;
  pendingTransactions: number;
  totalVolume: number;
  recentTransactions: OverviewTransaction[];
}

interface AdminOverviewProps {
  user: { name: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ user }) => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOverview(data);
        } else {
          setError(data.message || 'Unable to load overview.');
          setOverview(null);
        }
      } catch (loadError) {
        console.error('Failed to load admin overview', loadError);
        setError('Unable to load overview.');
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
    const intervalId = setInterval(loadOverview, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const recentTransactions = useMemo(() => {
    if (!overview?.recentTransactions) return [];
    return [...overview.recentTransactions].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [overview]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {user.name.split(' ')[0]}</h2>
        <p className="text-slate-400 text-sm">Here is the latest platform activity.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} /> Loading overview...
        </div>
      ) : error ? (
        <Card className="text-red-400">{error}</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UserCheck size={24} /></div>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">Live <ArrowUpRight size={12} /></span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{overview?.activeUsers ?? 0}</h3>
              <p className="text-slate-400 text-sm">Active Users</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><DollarSign size={24} /></div>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">Live <ArrowUpRight size={12} /></span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                Ksh {Number(overview?.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-slate-400 text-sm">Total Platform Volume</p>
            </Card>

            <Card className="bg-gradient-to-br from-amber-900/20 to-slate-900 border-amber-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><AlertTriangle size={24} /></div>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">Live <ArrowUpRight size={12} /></span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{overview?.pendingTransactions ?? 0}</h3>
              <p className="text-slate-400 text-sm">Pending Transactions</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="h-full" noPadding>
              <div className="p-6 border-b border-slate-800">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
              </div>
              {recentTransactions.length === 0 ? (
                <div className="p-6 text-slate-500">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50">
                      <div>
                        <p className="text-sm font-medium text-white">{tx.description}</p>
                        <p className="text-xs text-slate-500">{tx.user} - {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-white">Ksh {tx.amount.toFixed(2)}</p>
                        <span className={cn("text-[10px] uppercase font-bold",
                          tx.status === 'COMPLETED' ? 'text-emerald-500' :
                            tx.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'
                        )}>{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="h-full">
              <h3 className="font-bold text-lg mb-4">Platform Health</h3>
              <div className="space-y-4">
                {['Server Uptime', 'Database Latency', 'API Response Time'].map(metric => (
                  <div key={metric} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{metric}</span>
                      <span className="text-emerald-400">Good</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[95%]"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="font-bold text-sm text-slate-300 mb-3">Pending Moderation</h4>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-slate-300">Moderation queue will appear here.</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
