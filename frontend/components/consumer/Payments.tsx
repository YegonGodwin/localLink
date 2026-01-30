import React from 'react';
import { Card } from '../Layout';
import { MOCK_PAYMENTS } from '../../constants';

export const Payments: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h3 className="text-2xl font-bold mb-6">Payment History</h3>
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
                    <div className="w-1/4 text-right text-white font-mono text-sm">${payment.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                 </div>
               ))}
            </div>
         </div>
      </Card>
    </div>
  );
};