import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Modal } from '../Layout';
import { Loader2 } from 'lucide-react';
import { User } from '../../types';

interface ApiUser extends User {
  _id?: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ user: User; status: 'ACTIVE' | 'SUSPENDED' } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/users', {
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
            status: u.status || 'ACTIVE',
            location: u.location,
          }));
          setUsers(mapped);
        } else {
          setUsers([]);
          setError(data.message || 'Unable to load users.');
        }
      } catch (loadError) {
        console.error('Failed to load users', loadError);
        setUsers([]);
        setError('Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    const intervalId = setInterval(loadUsers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const updateStatus = async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    const token = localStorage.getItem('token');
    try {
      setSavingId(userId);
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update user status.');
      }
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status } : u)));
    } catch (statusError) {
      console.error('Failed to update user status', statusError);
      setError('Unable to update user status.');
    } finally {
      setSavingId(null);
    }
  };

  const confirmLabel = confirmState?.status === 'SUSPENDED' ? 'Suspend User' : 'Unsuspend User';
  const confirmBody = confirmState?.status === 'SUSPENDED'
    ? 'This will suspend the user and restrict their access.'
    : 'This will restore the user and allow access again.';

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
            {loading ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={18} /> Loading users...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-red-400" colSpan={4}>{error}</td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={4}>No users found.</td>
              </tr>
            ) : (
              sortedUsers.map(user => (
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
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs border-red-900/50 text-red-400 hover:bg-red-900/20"
                          disabled={savingId === user.id}
                          onClick={() => setConfirmState({ user, status: 'SUSPENDED' })}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                          disabled={savingId === user.id}
                          onClick={() => setConfirmState({ user, status: 'ACTIVE' })}
                        >
                          Unsuspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        title={confirmLabel}
      >
        <div className="space-y-5">
          <p className="text-slate-300 text-sm">
            {confirmBody}
          </p>
          {confirmState && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm">
              <div className="text-white font-medium">{confirmState.user.name}</div>
              <div className="text-slate-500">{confirmState.user.email}</div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmState(null)}>Cancel</Button>
            <Button
              variant={confirmState?.status === 'SUSPENDED' ? 'danger' : 'secondary'}
              onClick={() => {
                if (!confirmState) return;
                updateStatus(confirmState.user.id, confirmState.status);
                setConfirmState(null);
              }}
            >
              {confirmState?.status === 'SUSPENDED' ? 'Confirm Suspend' : 'Confirm Unsuspend'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
