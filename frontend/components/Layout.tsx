
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, UserRole } from '../types';
import { Bell, Home, Briefcase, Settings, LogOut, Menu, X, Users, Shield, DollarSign, MessageSquare, CreditCard, Search, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSocket, joinUserRoom } from '../services/socketService';

// Helper for tailwind class merging
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  children: React.ReactNode;
}

interface HeaderNotification {
  id: string;
  type?: 'message' | 'booking';
  title: string;
  description: string;
  timestamp: string;
  targetView: string;
  unread: boolean;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  count 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-1 group relative",
      active 
        ? "bg-blue-600/10 text-blue-500" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    )}
  >
    <Icon size={20} className={cn("mr-3", active ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300")} />
    <span className="font-medium text-sm">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="absolute right-4 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentView, onChangeView, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [providerPendingRequestsCount, setProviderPendingRequestsCount] = useState(0);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const readNotificationIdsRef = useRef<string[]>([]);
  const notificationStorageKey = `header_notification_read_ids_${user.role}_${user.id}`;

  useEffect(() => {
    if (user.role !== 'CONSUMER' && user.role !== 'PROVIDER') {
      setUnreadMessagesCount(0);
      return;
    }

    let isMounted = true;

    const fetchUnreadMessagesCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) setUnreadMessagesCount(0);
          return;
        }

        const res = await fetch('/api/chat/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const contacts = await res.json();
        const totalUnread = Array.isArray(contacts)
          ? contacts.reduce((sum, contact) => sum + (Number(contact?.unread) || 0), 0)
          : 0;

        if (isMounted) {
          setUnreadMessagesCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };

    fetchUnreadMessagesCount();
    const interval = setInterval(fetchUnreadMessagesCount, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user.role]);

  useEffect(() => {
    readNotificationIdsRef.current = readNotificationIds;
  }, [readNotificationIds]);

  useEffect(() => {
    if (user.role === 'ADMIN') {
      setReadNotificationIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(notificationStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setReadNotificationIds(parsed.filter((id): id is string => typeof id === 'string'));
      } else {
        setReadNotificationIds([]);
      }
    } catch {
      setReadNotificationIds([]);
    }
  }, [notificationStorageKey, user.role]);

  useEffect(() => {
    joinUserRoom(user.id);
    const socket = getSocket();

    const handleRealtimeNotification = (event: HeaderNotification) => {
      if (user.role === 'ADMIN' || !event?.id) {
        return;
      }

      const isRead = readNotificationIdsRef.current.includes(event.id);
      setHeaderNotifications((prev) => {
        const nextEvent: HeaderNotification = {
          id: event.id,
          type: event.type,
          title: event.title || 'New notification',
          description: event.description || '',
          timestamp: event.timestamp || new Date().toISOString(),
          targetView: event.targetView || 'dashboard',
          unread: !isRead,
        };

        const deduped = [nextEvent, ...prev.filter((item) => item.id !== event.id)];
        deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return deduped.slice(0, 20);
      });
    };

    const handleRealtimeMessage = (event: { sender?: string; receiver?: string }) => {
      if (!event) return;
      const isIncoming = event.receiver === user.id && event.sender !== user.id;
      if (user.role !== 'ADMIN' && isIncoming && currentView !== 'messages') {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    };

    socket.on('notification:new', handleRealtimeNotification);
    socket.on('chat:message', handleRealtimeMessage);

    return () => {
      socket.off('notification:new', handleRealtimeNotification);
      socket.off('chat:message', handleRealtimeMessage);
    };
  }, [currentView, user.id, user.role]);

  useEffect(() => {
    if (user.role === 'ADMIN') {
      setHeaderNotifications([]);
      return;
    }

    let isMounted = true;

    const fetchHeaderNotifications = async () => {
      try {
        if (isMounted) setLoadingNotifications(true);
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) setHeaderNotifications([]);
          return;
        }

        const bookingEndpoint = user.role === 'PROVIDER' ? '/api/bookings/my-jobs' : '/api/bookings/my-bookings';
        const [contactsRes, bookingsRes] = await Promise.all([
          fetch('/api/chat/contacts', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(bookingEndpoint, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        const notifications: HeaderNotification[] = [];

        if (contactsRes.ok) {
          const contacts = await contactsRes.json();
          if (Array.isArray(contacts)) {
            contacts
              .filter((contact: any) => Number(contact?.unread) > 0)
              .forEach((contact: any) => {
                const ts = contact?.lastMessageTime || new Date().toISOString();
                const id = `msg-${String(contact?.id || '')}-${String(ts)}`;
                notifications.push({
                  id,
                  title: `New message from ${contact?.name || 'Provider'}`,
                  description: `${Number(contact?.unread)} unread message${Number(contact?.unread) === 1 ? '' : 's'}`,
                  timestamp: ts,
                  targetView: 'messages',
                  unread: !readNotificationIds.includes(id),
                });
              });
          }
        }

        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          if (Array.isArray(bookings)) {
            const bookingStatusLabels =
              user.role === 'PROVIDER'
                ? ({
                    PENDING: 'New service request',
                    COMPLETED: 'Job marked as completed',
                    CANCELLED: 'Job was cancelled',
                    IN_PROGRESS: 'Job moved to in progress',
                  } as Record<string, string>)
                : ({
                    IN_PROGRESS: 'Service request accepted',
                    COMPLETED: 'Service marked as completed',
                    CANCELLED: 'Service request cancelled',
                  } as Record<string, string>);

            bookings.forEach((booking: any) => {
              const status = String(booking?.status || '');
              if (!bookingStatusLabels[status]) {
                return;
              }
              const ts = booking?.updatedAt || booking?.date || new Date().toISOString();
              const id = `booking-${String(booking?._id || '')}-${status}-${String(ts)}`;
              notifications.push({
                id,
                title: bookingStatusLabels[status],
                description:
                  user.role === 'PROVIDER'
                    ? `${booking?.service?.title || 'Service'} requested by ${booking?.consumer?.name || 'consumer'}`
                    : `${booking?.service?.title || 'Service'} with ${booking?.provider?.name || 'provider'}`,
                timestamp: ts,
                targetView: 'requests',
                unread: !readNotificationIds.includes(id),
              });
            });
          }
        }

        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (isMounted) {
          setHeaderNotifications(notifications.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        if (isMounted) setLoadingNotifications(false);
      }
    };

    fetchHeaderNotifications();
    const interval = setInterval(fetchHeaderNotifications, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [readNotificationIds, user.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationPanelRef.current) {
        return;
      }
      if (!notificationPanelRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadHeaderNotificationsCount = useMemo(
    () => headerNotifications.filter((notification) => notification.unread).length,
    [headerNotifications]
  );

  const markNotificationsRead = (ids: string[]) => {
    if (ids.length === 0 || user.role === 'ADMIN') {
      return;
    }
    setReadNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...ids]));
      localStorage.setItem(notificationStorageKey, JSON.stringify(merged));
      return merged;
    });
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (Number.isNaN(diffMs)) {
      return 'Just now';
    }
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < minute) return 'Just now';
    if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (user.role !== 'PROVIDER') {
      setProviderPendingRequestsCount(0);
      return;
    }

    let isMounted = true;

    const fetchProviderPendingRequestsCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) setProviderPendingRequestsCount(0);
          return;
        }

        const res = await fetch('/api/bookings/my-jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const jobs = await res.json();
        const pendingCount = Array.isArray(jobs)
          ? jobs.filter((job) => job?.status === 'PENDING').length
          : 0;

        if (isMounted) {
          setProviderPendingRequestsCount(pendingCount);
        }
      } catch (error) {
        console.error('Error fetching provider pending requests count:', error);
      }
    };

    fetchProviderPendingRequestsCount();
    const interval = setInterval(fetchProviderPendingRequestsCount, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user.role]);

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'CONSUMER':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'explore', label: 'Explore Services', icon: Search },
          { id: 'requests', label: 'Service Requests', icon: Briefcase },
          { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadMessagesCount },
          { id: 'payments', label: 'Payments', icon: CreditCard },
        ];
      case 'PROVIDER':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'requests', label: 'Service Requests', icon: Briefcase, count: providerPendingRequestsCount },
          { id: 'services', label: 'My Services', icon: Settings },
          { id: 'earnings', label: 'Earnings', icon: DollarSign },
          { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadMessagesCount },
          { id: 'profile', label: 'Profile Settings', icon: UserIcon },
        ];
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Overview', icon: Home },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'transactions', label: 'Transactions', icon: DollarSign },
          { id: 'escrow-ops', label: 'Escrow Ops', icon: CreditCard },
          { id: 'moderation', label: 'Moderation', icon: Shield },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems(user.role);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">LocalLink</span>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => onChangeView(item.id)}
              count={item.count}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center p-2 mb-2 rounded-lg bg-slate-800/50 border border-slate-800">
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full object-cover" />
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-2 py-2 text-slate-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative border-l border-slate-800">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-20">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded-full"></div>
            </div>
            <span className="font-bold text-lg">LocalLink</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-50 bg-slate-950/95 p-4 animate-in fade-in slide-in-from-top-4">
             <nav className="flex flex-col space-y-2 mt-8">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={currentView === item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  count={item.count}
                />
              ))}
              <div className="h-px bg-slate-800 my-4" />
              <button 
                onClick={onLogout}
                className="flex items-center px-4 py-3 text-red-400"
              >
                <LogOut size={20} className="mr-3" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
        
        {/* Desktop Header/Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950">
           <h2 className="text-xl font-semibold text-white capitalize">
             {navItems.find(i => i.id === currentView)?.label || 'Dashboard'}
           </h2>
           <div className="flex items-center space-x-4 relative" ref={notificationPanelRef}>
             <button
               className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all relative"
               onClick={() => setNotificationOpen((prev) => !prev)}
               aria-label="Notifications"
             >
               <Bell size={20} />
               {user.role !== 'ADMIN' && unreadHeaderNotificationsCount > 0 && (
                 <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full border-2 border-slate-950 flex items-center justify-center">
                   {unreadHeaderNotificationsCount > 99 ? '99+' : unreadHeaderNotificationsCount}
                 </span>
               )}
             </button>

             {notificationOpen && user.role !== 'ADMIN' && (
               <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50">
                 <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                   <h3 className="text-sm font-semibold text-white">Notifications</h3>
                   <button
                     className="text-xs text-blue-400 hover:text-blue-300 disabled:text-slate-500"
                     disabled={unreadHeaderNotificationsCount === 0}
                     onClick={() =>
                       markNotificationsRead(
                         headerNotifications
                           .filter((notification) => notification.unread)
                           .map((notification) => notification.id)
                       )
                     }
                   >
                     Mark all as read
                   </button>
                 </div>
                 <div className="max-h-96 overflow-y-auto">
                   {loadingNotifications ? (
                     <div className="px-4 py-6 text-sm text-slate-400">Loading notifications...</div>
                   ) : headerNotifications.length === 0 ? (
                     <div className="px-4 py-6 text-sm text-slate-500">No notifications yet.</div>
                   ) : (
                     headerNotifications.map((notification) => (
                       <button
                         key={notification.id}
                         className={cn(
                           "w-full text-left px-4 py-3 border-b border-slate-800/70 hover:bg-slate-800/60 transition-colors",
                           notification.unread ? "bg-blue-600/5" : "bg-transparent"
                         )}
                         onClick={() => {
                           markNotificationsRead([notification.id]);
                           setNotificationOpen(false);
                           onChangeView(notification.targetView);
                         }}
                       >
                         <div className="flex items-start justify-between gap-2">
                           <p className={cn("text-sm", notification.unread ? "text-white font-medium" : "text-slate-300")}>
                             {notification.title}
                           </p>
                           <span className="text-[11px] text-slate-500 whitespace-nowrap">
                             {formatNotificationTime(notification.timestamp)}
                           </span>
                         </div>
                         <p className="text-xs text-slate-400 mt-1">{notification.description}</p>
                       </button>
                     ))
                   )}
                 </div>
               </div>
             )}
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- Shared UI Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, noPadding }) => (
  <div className={cn("bg-slate-900 border border-slate-800 rounded-xl overflow-hidden", className)}>
    <div className={cn(noPadding ? "" : "p-5")}>
      {children}
    </div>
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'info';
  // Adding className to fix type error in EditProfile.tsx
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-800 text-slate-300",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/20",
    error: "bg-red-500/20 text-red-400 border border-red-500/20",
    outline: "border border-slate-700 text-slate-400",
    info: "bg-blue-600/20 text-blue-400 border border-blue-500/20"
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  };

  return (
    <button className={cn("rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center", variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
