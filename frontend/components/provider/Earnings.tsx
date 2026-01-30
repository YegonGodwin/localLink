import React from 'react';
import { Card } from '../Layout';
import { MOCK_TRANSACTIONS } from '../../constants';
import { Download } from 'lucide-react';

export const Earnings: React.FC = () => {
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
           <div className="text-3xl font-bold text-white mt-1">$2,450.00</div>
        </Card>
        <Card>
           <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Pending Clearance</span>
           <div className="text-3xl font-bold text-white mt-1">$350.00</div>
        </Card>
        <Card>
           <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Withdrawn</span>
           <div className="text-3xl font-bold text-white mt-1">$12,800.00</div>
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
                {MOCK_TRANSACTIONS.map(tx => (
                   <tr key={tx.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">#{tx.id.toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{tx.date}</td>
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