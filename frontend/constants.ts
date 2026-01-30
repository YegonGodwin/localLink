import { User, Service, Booking, Transaction, ChatContact, ChatMessage } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'CONSUMER',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'ACTIVE'
  },
  {
    id: 'u2',
    name: 'John Doe',
    email: 'john@plumbing.com',
    role: 'PROVIDER',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    verified: true,
    status: 'ACTIVE'
  },
  {
    id: 'u3',
    name: 'Admin User',
    email: 'admin@locallink.com',
    role: 'ADMIN',
    avatar: 'https://picsum.photos/id/66/100/100',
    status: 'ACTIVE'
  },
  {
    id: 'u4',
    name: 'Sarah Smith',
    email: 'sarah@design.com',
    role: 'PROVIDER',
    avatar: 'https://picsum.photos/id/67/100/100',
    verified: false,
    status: 'SUSPENDED'
  }
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    providerId: 'u2',
    providerName: "John Doe",
    providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    title: 'Plumbing Services',
    description: '24/7 emergency plumbing services for leaks, clogs, and pipe bursts.',
    category: 'Plumbing',
    price: 150,
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's2',
    providerId: 'u5',
    providerName: 'Pawsitive Walks',
    providerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: 'Dog Walking',
    description: 'Reliable dog walking and pet sitting services.',
    category: 'Dog Walking',
    price: 30,
    rating: 5.0,
    reviews: 97,
    image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's3',
    providerId: 'u6',
    providerName: 'Clean Sweep Inc.',
    providerAvatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    title: 'Home Cleaning',
    description: 'Full house deep cleaning including carpets and windows.',
    category: 'Home Cleaning',
    price: 120,
    rating: 4.8,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1581578731117-104f2a8d275d?auto=format&fit=crop&q=80&w=400'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    serviceId: 's1',
    consumerId: 'u1',
    providerId: 'u2',
    serviceTitle: 'Kitchen Sink Repair',
    providerName: "John Doe",
    consumerName: 'Maria Garcia',
    date: '2023-10-28T14:00:00Z',
    status: 'IN_PROGRESS',
    price: 150
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-28', amount: 80.00, status: 'COMPLETED', description: 'Payout for Booking #B102', user: 'John Doe' },
];

export const MOCK_CHATS: ChatContact[] = [
  { id: 'c1', name: 'John Doe', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', lastMessage: 'Does that work?', lastMessageTime: '2:09 PM', unread: 0, online: true },
  { id: 'c2', name: 'Sparkle Clean', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', lastMessage: 'Does Thursday work for you?', lastMessageTime: 'Yesterday', unread: 2, online: false },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'u2', text: 'I have finished the initial assessment. The main pipe under the sink has a significant leak. I can replace it today.', timestamp: '2:05 PM' },
  { id: 'm2', senderId: 'u1', text: 'Okay, I can be there at 3 PM to let you in. Does that work?', timestamp: '2:09 PM' },
  { id: 'm3', senderId: 'u1', text: '', timestamp: '2:10 PM', isImage: true },
];

export const MOCK_PAYMENTS = [
  { id: 'p1', date: 'Oct 28, 2023', provider: 'John Doe', service: 'Kitchen Sink Repair', amount: 150.00 },
];

export const MOCK_FAVORITES = [
  { id: 'f1', name: 'John Doe', role: 'Plumbing', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
];