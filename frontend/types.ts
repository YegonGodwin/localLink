export type UserRole = 'CONSUMER' | 'PROVIDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED';
  // Provider Profile Fields
  tagline?: string;
  bio?: string;
  phone?: string;
  address?: string;
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

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  user: string;
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