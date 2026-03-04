import React, { useEffect, useState } from 'react';
import { Card } from '../Layout';
import { Loader2 } from 'lucide-react';
import { Transaction } from '../../types';
import orderService from '../../services/orderService';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const orders = await orderService.getMyOrders();
        const mapped: Transaction[] = orderService.mapOrdersToPayments(orders, 'CONSUMER');
        if (Array.isArray(mapped)) {
          setPayments(mapped);
        } else {
          setPayments([]);
          setError('Unable to load payments.');
        }
      } catch (loadError) {
        console.error('Failed to load payments', loadError);
        setPayments([]);
        setError('Unable to load payments.');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
    const paymentsIntervalId = setInterval(loadPayments, 30000);
    return () => clearInterval(paymentsIntervalId);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h3 className="text-2xl font-bold mb-6">Payment History</h3>
      <Card noPadding className="overflow-hidden">
         <div className="w-full text-left">
             <div className="bg-slate-950/30 text-slate-500 text-xs font-bold uppercase py-3 px-6 flex">
                <div className="w-1/5">Date</div>
                <div className="w-1/5">Provider</div>
                <div className="w-1/5">Service</div>
                <div className="w-1/5">Status</div>
                <div className="w-1/5 text-right">Amount</div>
             </div>
            {loading ? (
              <div className="p-4 text-slate-400 flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-500" size={18} /> Loading payments...
              </div>
            ) : error ? (
              <div className="p-4 text-red-400">{error}</div>
            ) : payments.length === 0 ? (
              <div className="p-4 text-slate-500">No payments recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {payments.map((payment) => (
                  <div key={payment.id} className="py-4 px-6 flex items-center hover:bg-slate-800/30 transition-colors">
                    <div className="w-1/5 text-slate-300 text-sm">{new Date(payment.date).toLocaleDateString()}</div>
                    <div className="w-1/5 text-white font-medium text-sm">{payment.user}</div>
                    <div className="w-1/5 text-slate-400 text-sm">{payment.description}</div>
                    <div className="w-1/5 text-slate-300 text-sm capitalize">{payment.status?.toLowerCase() || 'pending'}</div>
                    <div className="w-1/5 text-right text-white font-mono text-sm">Ksh {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            )}
         </div>
      </Card>
    </div>
  );
};
