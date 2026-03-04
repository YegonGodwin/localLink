import { Booking, Order, Transaction, UserRole } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const orderService = {
  async getMyOrders(status?: string): Promise<Order[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/orders/my-orders${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Unable to load orders');
    }
    return Array.isArray(data) ? data : [];
  },

  async getOrderById(orderId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Unable to load order');
    }
    return data as Order;
  },

  mapOrdersToBookings(orders: Order[]): Booking[] {
    return orders.flatMap((order) =>
      (order.bookingIds || []).map((booking) => ({
        id: booking._id,
        serviceId: booking.service?._id || '',
        consumerId: booking.consumer?._id || order.consumer?._id || '',
        providerId: booking.provider?._id || order.provider?._id || '',
        serviceTitle: booking.serviceTitleSnapshot || booking.service?.title || order.services?.[0]?.title || 'Service',
        providerName: booking.provider?.name || order.provider?.name || 'Provider',
        consumerName: booking.consumer?.name || order.consumer?.name || 'Client',
        date: booking.date || booking.createdAt || order.createdAt,
        status: booking.status,
        price: Number(booking.price || booking.unitPriceSnapshot || order.totalAmount || 0),
      }))
    );
  },

  mapOrdersToPayments(orders: Order[], role: UserRole): Transaction[] {
    return orders
      .filter((order) => order.paymentTransaction)
      .map((order) => {
        const txn = order.paymentTransaction!;
        const firstService = order.services?.[0]?.title || 'Service';
        const multiService = (order.services?.length || 0) > 1;
        const description = multiService
          ? `${firstService} + ${(order.services?.length || 1) - 1} more`
          : firstService;

        return {
          id: txn._id || order._id,
          date: txn.createdAt || order.createdAt,
          amount: Number(txn.amount || order.totalAmount || 0),
          status: txn.status,
          description,
          user: role === 'PROVIDER'
            ? (order.consumer?.name || 'Customer')
            : (order.provider?.name || 'Provider'),
        } as Transaction;
      });
  },
};

export default orderService;
