import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../Layout';
import { Transaction } from '@/types';
import { Download, Loader2 } from 'lucide-react';

export const Earnings: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');

    const loadTransactions = async () => {
      try {
        setError(null);
        const res = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && Array.isArray(data)) {
          const mapped: Transaction[] = data.map((t: any) => ({
            id: t._id,
            date: t.date || t.createdAt,
            amount: t.amount,
            status: t.status,
            description: t.description,
            user: t.user?.name || ''
          }));
          setTransactions(mapped);
        } else {
          setTransactions([]);
          setError('Unable to load transactions.');
        }
      } catch (err) {
        if (!active) return;
        setError('Unable to load transactions.');
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    loadTransactions();
    const intervalId = setInterval(loadTransactions, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const totals = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0);
    const pending = transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
    const withdrawn = transactions
      .filter(t => t.status === 'COMPLETED' && /withdraw|payout/i.test(t.description))
      .reduce((sum, t) => sum + t.amount, 0);
    const available = Math.max(0, completed - withdrawn);
    return { completed, pending, withdrawn, available };
  }, [transactions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Earnings History</h2>
        <button className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400">
          <Download size={16} /> Download Statement
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-emerald-900/10 border-emerald-500/20">
           <span className="text-sm text-emerald-500 font-medium uppercase tracking-wider">Available Balance</span>
           <div className="text-3xl font-bold text-white mt-1">
             {loading ? '...' : `$${totals.available.toFixed(2)}`}
           </div>
        </Card>
        <Card>
           <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Pending Clearance</span>
           <div className="text-3xl font-bold text-white mt-1">
             {loading ? '...' : `$${totals.pending.toFixed(2)}`}
           </div>
        </Card>
        <Card>
           <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Withdrawn</span>
           <div className="text-3xl font-bold text-white mt-1">
             {loading ? '...' : `$${totals.withdrawn.toFixed(2)}`}
           </div>
        </Card>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                   <th className="px-6 py-4">Transaction ID</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Description</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                   <th className="px-6 py-4 text-right">Status</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
                {loading ? (
                   <tr>
                      <td className="px-6 py-6 text-sm text-slate-400" colSpan={5}>
                         <span className="inline-flex items-center gap-2">
                           <Loader2 className="animate-spin text-blue-500" size={16} /> Loading transactions...
                         </span>
                      </td>
                   </tr>
                ) : error ? (
                   <tr>
                      <td className="px-6 py-6 text-sm text-red-400" colSpan={5}>{error}</td>
                   </tr>
                ) : transactions.length === 0 ? (
                   <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>No transactions yet.</td>
                   </tr>
                ) : transactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">#{tx.id.toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-white">{tx.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-white">${tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                            tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                         }`}>
                            {tx.status}
                         </span>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
