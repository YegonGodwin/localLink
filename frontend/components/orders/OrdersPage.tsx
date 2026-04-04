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
    console.log('Opening order details for:', orderId);
    try {
      setOrderDetailsLoading(true);
      const details = await orderService.getOrderById(orderId);
      console.log('Order details loaded:', details);
      setSelectedOrder(details);
    } catch (loadError: any) {
      console.error('Failed to load order details', loadError);
      alert(`Failed to load order details: ${loadError?.message || 'Unknown error'}`);
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
          <div className="space-y-6">
            {/* Order Info Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Order ID</div>
                  <div className="text-white font-mono">#{selectedOrder._id.slice(-10).toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Date</div>
                  <div className="text-white">{new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Status</div>
                  <Badge variant={toBadgeVariant(selectedOrder.status)}>{selectedOrder.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Payment</div>
                  <Badge variant={toBadgeVariant(selectedOrder.paymentTransaction?.status || 'default')}>
                    {(selectedOrder.paymentTransaction?.status || 'N/A').replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">{role === 'PROVIDER' ? 'Customer' : 'Provider'}</div>
                  <div className="text-white">{role === 'PROVIDER' ? (selectedOrder.consumer?.name || 'Customer') : (selectedOrder.provider?.name || 'Provider')}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-semibold mb-1">Total Amount</div>
                  <div className="text-white font-bold text-lg">{(selectedOrder.currency || 'KES')} {Number(selectedOrder.totalAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Services */}
            {selectedOrder.services && selectedOrder.services.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Services ({selectedOrder.services.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.services.map((svc, idx) => (
                    <div key={svc.service || idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-slate-200 text-sm font-medium">{svc.title}</div>
                        {svc.category && <div className="text-xs text-slate-500">{svc.category}</div>}
                      </div>
                      <span className="text-white font-semibold">KES {Number(svc.unitPrice || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings */}
            {selectedOrder.bookingIds && selectedOrder.bookingIds.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Bookings ({selectedOrder.bookingIds.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.bookingIds.map((booking) => (
                    <div key={booking._id} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-200 text-sm font-medium">
                          {booking.serviceTitleSnapshot || booking.service?.title || 'Service'}
                        </span>
                        <Badge variant={toBadgeVariant(booking.status)}>{booking.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {booking.date && (
                          <span>Scheduled: {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {booking.price && <span>Price: KES {Number(booking.price).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Transaction Details */}
            {selectedOrder.paymentTransaction && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Payment Transaction
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-slate-500">Transaction ID</div>
                    <div className="text-white font-mono text-right">#{selectedOrder.paymentTransaction._id.slice(-8).toUpperCase()}</div>
                    <div className="text-slate-500">Amount</div>
                    <div className="text-white text-right">KES {Number(selectedOrder.paymentTransaction.amount || 0).toLocaleString()}</div>
                    {selectedOrder.paymentTransaction.createdAt && (
                      <>
                        <div className="text-slate-500">Payment Date</div>
                        <div className="text-white text-right">{new Date(selectedOrder.paymentTransaction.createdAt).toLocaleDateString()}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!selectedOrder.services?.length && !selectedOrder.bookingIds?.length && (
              <div className="text-center py-6 text-slate-500">
                No additional details available for this order
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

