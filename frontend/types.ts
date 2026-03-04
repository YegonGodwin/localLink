export type UserRole = 'CONSUMER' | 'PROVIDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED';
  location?: string;
  password?: string;
  // Provider Profile Fields
  tagline?: string;
  bio?: string;
  phone?: string;
  address?: string;
  category?: string;
  website?: string;
  coverImage?: string;
  portfolio?: string[];
}

export interface Service {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  consumerId: string;
  providerId: string;
  serviceTitle: string;
  providerName: string;
  consumerName: string;
  date: string; // ISO date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
}

export interface Review {
  id: string;
  bookingId: string;
  serviceId: string;
  providerId: string;
  consumerId: string;
  consumerName: string;
  consumerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  description: string;
  user: string;
}

export interface OrderServiceSnapshot {
  service: string;
  title: string;
  category?: string | null;
  unitPrice: number;
}

export interface OrderPaymentTransaction {
  _id: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  amount: number;
  createdAt?: string;
}

export interface OrderBooking {
  _id: string;
  status: Booking['status'];
  price: number;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  serviceTitleSnapshot?: string | null;
  unitPriceSnapshot?: number | null;
  service?: {
    _id?: string;
    title?: string;
  };
  provider?: {
    _id?: string;
    name?: string;
  };
  consumer?: {
    _id?: string;
    name?: string;
  };
}

export interface Order {
  _id: string;
  status: 'INITIATED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'BOOKINGS_CREATED' | 'FAILED' | 'CANCELLED';
  totalAmount: number;
  currency?: string;
  createdAt: string;
  consumer?: {
    _id?: string;
    name?: string;
  };
  provider?: {
    _id?: string;
    name?: string;
  };
  services?: OrderServiceSnapshot[];
  paymentTransaction?: OrderPaymentTransaction | null;
  bookingIds?: OrderBooking[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isImage?: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}
