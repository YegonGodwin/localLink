
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Bell, Home, Briefcase, Settings, LogOut, Menu, X, Users, Shield, DollarSign, MessageSquare, CreditCard, Search, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'CONSUMER':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'explore', label: 'Explore Services', icon: Search },
          { id: 'requests', label: 'Service Requests', icon: Briefcase },
          { id: 'messages', label: 'Messages', icon: MessageSquare, count: 2 },
          { id: 'payments', label: 'Payments', icon: CreditCard },
        ];
      case 'PROVIDER':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'requests', label: 'Service Requests', icon: Briefcase, count: 5 },
          { id: 'services', label: 'My Services', icon: Settings },
          { id: 'earnings', label: 'Earnings', icon: DollarSign },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'profile', label: 'Profile Settings', icon: UserIcon },
        ];
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Overview', icon: Home },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'moderation', label: 'Moderation', icon: Shield },
          { id: 'transactions', label: 'Transactions', icon: DollarSign },
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
           <div className="flex items-center space-x-4">
             <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
             </button>
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
