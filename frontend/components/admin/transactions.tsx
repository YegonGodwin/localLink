import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from '../Layout';
import { Loader2 } from 'lucide-react';
import { Transaction } from '../../types';

interface ApiTransaction {
  _id: string;
  date?: string;
  createdAt?: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description?: string;
  booking?: {
    service?: { title?: string };
    provider?: { name?: string };
  };
  user?: { name?: string };
}

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const mapped: Transaction[] = data.map((t: ApiTransaction) => ({
            id: t._id,
            date: t.date || t.createdAt || new Date().toISOString(),
            amount: t.amount,
            status: t.status,
            description: t.booking?.service?.title || t.description || 'Payment',
            user: t.booking?.provider?.name || t.user?.name || 'User'
          }));
          setTransactions(mapped);
        } else {
          setTransactions([]);
          setError(data.message || 'Unable to load transactions.');
        }
      } catch (loadError) {
        console.error('Failed to load transactions', loadError);
        setTransactions([]);
        setError('Unable to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
    const intervalId = setInterval(loadTransactions, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const orderedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
      </div>

      <Card noPadding className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={5}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={18} /> Loading transactions...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-red-400" colSpan={5}>{error}</td>
              </tr>
            ) : orderedTransactions.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={5}>No transactions yet.</td>
              </tr>
            ) : (
              orderedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-300 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 text-white text-sm">{tx.user}</td>
                  <td className="p-4 text-slate-400 text-sm">{tx.description}</td>
                  <td className="p-4">
                    <Badge variant={
                      tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'
                    }>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right text-white font-mono text-sm">
                    Ksh {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
