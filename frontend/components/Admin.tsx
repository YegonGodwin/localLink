import React from 'react';
import { Card, Badge, Button, cn } from './Layout';
import { MOCK_USERS, MOCK_TRANSACTIONS } from '../constants';
import { UserCheck, UserX, AlertTriangle, ArrowUpRight, DollarSign } from 'lucide-react';

interface AdminProps {
  currentView: string;
}

export const AdminDashboard: React.FC<AdminProps> = ({ currentView }) => {
  
  if (currentView === 'users') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Management</h2>
          <Button variant="secondary">Export Data</Button>
        </div>
        <Card noPadding className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {MOCK_USERS.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>
                      {user.status || 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                       {user.status !== 'SUSPENDED' ? (
                         <Button variant="secondary" className="px-2 py-1 text-xs border-red-900/50 text-red-400 hover:bg-red-900/20">Suspend</Button>
                       ) : (
                         <Button variant="secondary" className="px-2 py-1 text-xs border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20">Activate</Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // Dashboard Overview
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UserCheck size={24} /></div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">+5.4% <ArrowUpRight size={12}/></span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">1,482</h3>
          <p className="text-slate-400 text-sm">Total Active Users</p>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/20">
          <div className="flex items-start justify-between mb-4">
             <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><DollarSign size={24} /></div>
             <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">+12.1% <ArrowUpRight size={12}/></span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">$45,231</h3>
          <p className="text-slate-400 text-sm">Total Platform Volume</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/20">
           <div className="flex items-start justify-between mb-4">
             <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24} /></div>
             <span className="text-xs font-mono text-red-400 flex items-center gap-1">+2 <ArrowUpRight size={12}/></span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">27</h3>
          <p className="text-slate-400 text-sm">Open Disputes</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-full" noPadding>
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-bold text-lg">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {MOCK_TRANSACTIONS.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50">
                <div>
                   <p className="text-sm font-medium text-white">{tx.description}</p>
                   <p className="text-xs text-slate-500">{tx.user} • {tx.date}</p>
                </div>
                <div className="text-right">
                   <p className="font-mono font-medium text-white">${tx.amount.toFixed(2)}</p>
                   <span className={cn("text-[10px] uppercase font-bold", 
                     tx.status === 'COMPLETED' ? 'text-emerald-500' :
                     tx.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'
                   )}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
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
               <span className="text-sm text-slate-300">5 New provider applications awaiting review</span>
               <Button variant="ghost" className="ml-auto text-xs py-1 h-auto">View</Button>
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
};