import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Modal } from '../Layout';
import { Loader2, RefreshCcw } from 'lucide-react';
import orderService from '../../services/orderService';
import { Order, UserRole } from '../../types';

interface OrdersPageProps {
  role: UserRole;
}

const toBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'outline' | 'info' => {
  if (status === 'BOOKINGS_CREATED' || status === 'COMPLETED') return 'success';
  if (status === 'PAYMENT_PENDING' || status === 'PAYMENT_COMPLETED') return 'warning';
  if (status === 'FAILED' || status === 'CANCELLED') return 'error';
  return 'default';
};

export const OrdersPage: React.FC<OrdersPageProps> = ({ role }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (loadError: any) {
      console.error('Failed to load orders', loadError);
      setOrders([]);
      setError(loadError?.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrder = async (orderId: string) => {
    try {
      setOrderDetailsLoading(true);
      const details = await orderService.getOrderById(orderId);
      setSelectedOrder(details);
    } catch (loadError) {
      console.error('Failed to load order details', loadError);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Orders</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setRefreshing(true);
            loadOrders();
          }}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCcw size={14} className="mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} />
          Loading orders...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">{error}</div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400">
          No orders yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const itemCount = order.services?.length || 0;
            const peerName = role === 'PROVIDER'
              ? (order.consumer?.name || 'Customer')
              : (order.provider?.name || 'Provider');
            return (
              <Card key={order._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">#{order._id.slice(-6)}</span>
                    <Badge variant={toBadgeVariant(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
                    <Badge variant={toBadgeVariant(order.paymentTransaction?.status || 'default')}>
                      Payment: {(order.paymentTransaction?.status || 'N/A').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-slate-200 text-sm">
                    {itemCount} item{itemCount === 1 ? '' : 's'} with <span className="text-white font-medium">{peerName}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white">
                    {(order.currency || 'KES')} {Number(order.totalAmount || 0).toLocaleString()}
                  </span>
                  <Button variant="secondary" onClick={() => openOrder(order._id)}>
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
      >
        {orderDetailsLoading || !selectedOrder ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={18} />
            Loading order details...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-slate-400">Order ID</div>
              <div className="text-white font-mono text-right">#{selectedOrder._id.slice(-10).toUpperCase()}</div>
              <div className="text-slate-400">Status</div>
              <div className="text-right">
                <Badge variant={toBadgeVariant(selectedOrder.status)}>{selectedOrder.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="text-slate-400">Payment</div>
              <div className="text-right">
                <Badge variant={toBadgeVariant(selectedOrder.paymentTransaction?.status || 'default')}>
                  {(selectedOrder.paymentTransaction?.status || 'N/A').replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="text-slate-400">Total</div>
              <div className="text-white text-right font-semibold">
                {(selectedOrder.currency || 'KES')} {Number(selectedOrder.totalAmount || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Services</h4>
              <div className="space-y-2">
                {(selectedOrder.services || []).map((svc) => (
                  <div key={svc.service} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="text-slate-200 text-sm">{svc.title}</span>
                    <span className="text-slate-400 text-sm">KES {Number(svc.unitPrice || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Bookings</h4>
              <div className="space-y-2">
                {(selectedOrder.bookingIds || []).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="text-slate-200 text-sm">
                      {booking.serviceTitleSnapshot || booking.service?.title || 'Service'}
                    </span>
                    <Badge variant={toBadgeVariant(booking.status)}>{booking.status.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

