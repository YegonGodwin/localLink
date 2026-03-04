import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../Layout';
import { Calendar, DollarSign, CheckCircle, XCircle, MessageSquare, Loader2, RefreshCcw } from 'lucide-react';
import { Booking } from '../../types';
import orderService from '../../services/orderService';

interface ServiceRequestsProps {
  onMessageUser: (userId: string) => void;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ onMessageUser }) => {
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      if (!refreshing) setLoading(true);
      const orders = await orderService.getMyOrders();
      const mapped: Booking[] = orderService.mapOrdersToBookings(orders);
      if (Array.isArray(mapped)) {
        setJobs(mapped);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setJobs(prev => prev.map(job => job.id === id ? { ...job, status } : job));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderBadge = (status: Booking['status']) => {
    if (status === 'PENDING') return 'warning';
    if (status === 'IN_PROGRESS') return 'default';
    if (status === 'COMPLETED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Incoming Requests</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setRefreshing(true); fetchJobs(); }}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCcw size={14} className="mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} />
          Loading requests...
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
          No incoming service requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(booking => (
            <Card key={booking.id} className="flex flex-col md:flex-row items-center gap-6 p-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-500 uppercase">#{booking.id.slice(-6)}</span>
                  <Badge variant={renderBadge(booking.status)}>{booking.status}</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{booking.serviceTitle}</h3>
                <p className="text-slate-400 text-sm mb-3">Requested by <span className="text-white font-medium">{booking.consumerName}</span></p>
                <div className="flex gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"><DollarSign size={12} /> Ksh {booking.price}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => onMessageUser(booking.consumerId)}
                >
                  <MessageSquare size={16} className="mr-2" /> Message
                </Button>
                {booking.status === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      className="flex-1 md:flex-none"
                      disabled={updatingId === booking.id}
                      onClick={() => updateStatus(booking.id, 'CANCELLED')}
                    >
                      {updatingId === booking.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <XCircle size={16} className="mr-2" />} Decline
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
                      disabled={updatingId === booking.id}
                      onClick={() => updateStatus(booking.id, 'IN_PROGRESS')}
                    >
                      {updatingId === booking.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Accept
                    </Button>
                  </>
                )}
                {booking.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700"
                    disabled={updatingId === booking.id}
                    onClick={() => updateStatus(booking.id, 'COMPLETED')}
                  >
                    {updatingId === booking.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Mark Done
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
