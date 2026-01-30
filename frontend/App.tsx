import React, { useState, useEffect } from 'react';
import { Layout, Button, cn } from './components/Layout';
import { ConsumerDashboard } from './components/consumer/index';
import { ProviderDashboard } from './components/provider/index';
import { Onboarding } from './components/provider/Onboarding';
import { AdminDashboard } from './components/Admin';
import { ChatInterface } from './components/Chat';
import { LandingPage } from './components/LandingPage';
import { MOCK_USERS } from './constants';
import { User, UserRole } from './types';
import { ShieldCheck, Briefcase, User as UserIcon, X, Check } from 'lucide-react';

// Enhanced Login/Signup Modal with Overflow Handling
const LoginModal = ({ 
  isOpen, 
  onClose, 
  onLogin,
  onSignup,
  initialIsSignup = false,
  initialRole = 'CONSUMER'
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onLogin: (userId: string) => void,
  onSignup: (role: UserRole, email: string, name: string) => void,
  initialIsSignup?: boolean,
  initialRole?: UserRole
}) => {
  const [isSignup, setIsSignup] = useState(initialIsSignup);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Sync internal state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSignup(initialIsSignup);
      setRole(initialRole);
    }
  }, [isOpen, initialIsSignup, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (isSignup) {
      if (email && name) onSignup(role, email, name);
    } else {
      // Logic for quick login demo
      const user = MOCK_USERS.find(u => u.role === role);
      onLogin(user?.id || 'u1');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div 
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <div className="w-8 h-8 border-4 border-white rounded-full"></div>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-center text-slate-400 mb-6 text-sm md:text-base">{isSignup ? 'Join LocalLink to get started' : 'Sign in to LocalLink to continue'}</p>
          
          {/* Toggle Signup/Login */}
          <div className="flex bg-slate-950 p-1 rounded-lg mb-6">
             <button 
               onClick={() => setIsSignup(false)}
               className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", !isSignup ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300")}
             >
               Sign In
             </button>
             <button 
               onClick={() => setIsSignup(true)}
               className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", isSignup ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300")}
             >
               Sign Up
             </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
                <button 
                  onClick={() => setRole('CONSUMER')}
                  className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative", role === 'CONSUMER' ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700")}
                >
                  <UserIcon size={20} />
                  <span className="text-xs font-bold">Consumer</span>
                  {role === 'CONSUMER' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>}
                </button>
                <button 
                  onClick={() => setRole('PROVIDER')}
                  className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative", role === 'PROVIDER' ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700")}
                >
                  <Briefcase size={20} />
                  <span className="text-xs font-bold">Provider</span>
                  {role === 'PROVIDER' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>}
                </button>
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="John Doe" 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="name@example.com" 
              />
            </div>
            
            <Button className="w-full py-3" onClick={handleSubmit}>
              {isSignup ? (role === 'PROVIDER' ? 'Continue to Profile Setup' : 'Create Account') : 'Sign In'}
            </Button>
          </div>

          {!isSignup && (
            <div className="mt-8 pt-8 border-t border-slate-800">
               <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-wider font-semibold">Dev Mode: Quick Login</p>
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onLogin('u1')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-blue-500/50 group">
                     <UserIcon size={20} className="mb-2 text-blue-400 group-hover:scale-110 transition-transform"/>
                     <span className="text-xs font-medium text-slate-300">Consumer</span>
                  </button>
                  <button onClick={() => onLogin('u2')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-emerald-500/50 group">
                     <Briefcase size={20} className="mb-2 text-emerald-400 group-hover:scale-110 transition-transform"/>
                     <span className="text-xs font-medium text-slate-300">Provider</span>
                  </button>
                  <button onClick={() => onLogin('u3')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500/50 group">
                     <ShieldCheck size={20} className="mb-2 text-purple-400 group-hover:scale-110 transition-transform"/>
                     <span className="text-xs font-medium text-slate-300">Admin</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [authConfig, setAuthConfig] = useState<{isSignup: boolean, role: UserRole}>({
    isSignup: false,
    role: 'CONSUMER'
  });

  const handleAuthAction = (mode: 'login' | 'signup', role: UserRole = 'CONSUMER') => {
    setAuthConfig({
      isSignup: mode === 'signup',
      role: role
    });
    setIsLoginOpen(true);
  };

  const handleLogin = (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setCurrentView('dashboard');
      setIsLoginOpen(false);
      setIsOnboarding(false);
    }
  };

  const handleSignup = (role: UserRole, email: string, name: string) => {
    // Create new mock user
    const newUser: User = {
      id: `new_${Date.now()}`,
      name,
      email,
      role,
      avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
      status: 'ACTIVE',
      verified: false
    };
    
    setCurrentUser(newUser);
    setIsLoginOpen(false);

    if (role === 'PROVIDER') {
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
      setCurrentView('dashboard');
    }
  };

  const handleOnboardingComplete = (updatedProfile: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedProfile });
      setIsOnboarding(false);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setIsOnboarding(false);
  };

  // Onboarding View
  if (currentUser && isOnboarding) {
    return <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />;
  }

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    if (!currentUser) return null;

    if (currentView === 'messages') {
      return <ChatInterface />;
    }

    switch (currentUser.role) {
      case 'CONSUMER':
        return <ConsumerDashboard currentView={currentView} />;
      case 'PROVIDER':
        return <ProviderDashboard currentView={currentView} />;
      case 'ADMIN':
        return <AdminDashboard currentView={currentView} />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  if (!currentUser) {
    return (
      <>
        <LandingPage onAuthAction={handleAuthAction} />
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          onLogin={handleLogin}
          onSignup={handleSignup}
          initialIsSignup={authConfig.isSignup}
          initialRole={authConfig.role}
        />
      </>
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      currentView={currentView}
      onChangeView={setCurrentView}
    >
      {renderDashboard()}
    </Layout>
  );
}