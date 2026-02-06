import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '../Layout';
import { Loader2 } from 'lucide-react';
import { User } from '../../types';

interface ApiUser extends User {
  _id?: string;
}

export const AdminModeration: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users?status=SUSPENDED', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const mapped: User[] = data.map((u: ApiUser) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
          verified: u.verified,
          status: u.status || 'SUSPENDED',
          location: u.location,
        }));
        setUsers(mapped);
      } else {
        setUsers([]);
        setError(data.message || 'Unable to load suspended users.');
      }
    } catch (loadError) {
      console.error('Failed to load suspended users', loadError);
      setUsers([]);
      setError('Unable to load suspended users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const intervalId = setInterval(loadUsers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const orderedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const reinstateUser = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      setSavingId(userId);
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ACTIVE' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reinstate user.');
      }
      await loadUsers();
    } catch (actionError) {
      console.error('Failed to reinstate user', actionError);
      setError('Unable to reinstate user.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suspended Users</h2>
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
            {loading ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={18} /> Loading suspended users...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-red-400" colSpan={4}>{error}</td>
              </tr>
            ) : orderedUsers.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={4}>No suspended users.</td>
              </tr>
            ) : (
              orderedUsers.map(user => (
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
                    <Badge variant="error">{user.status || 'SUSPENDED'}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                      disabled={savingId === user.id}
                      onClick={() => reinstateUser(user.id)}
                    >
                      Reinstate
                    </Button>
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
