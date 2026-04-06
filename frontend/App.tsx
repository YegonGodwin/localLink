import React, { useState, useEffect } from 'react';
import { Layout, Button, cn } from './components/Layout';
import { ConsumerDashboard } from './components/consumer/index';
import { ProviderDashboard } from './components/provider/index';
import { Onboarding } from './components/provider/Onboarding';
import { AdminDashboard } from './components/admin';
import { ChatInterface } from './components/Chat';
import { LandingPage } from './components/LandingPage';
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
  onLogin: (email: string, password: string) => void,
  onSignup: (role: UserRole, email: string, name: string, location: string, password: string) => void,
  initialIsSignup?: boolean,
  initialRole?: UserRole
}) => {
  const [isSignup, setIsSignup] = useState(initialIsSignup);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');

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
      // For consumers, require location; for providers, skip location
      const isValid = role === 'CONSUMER'
        ? (email && name && location && password)
        : (email && name && password);

      if (isValid) onSignup(role, email, name, location, password);
    } else {
      if (email && password) onLogin(email, password);
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

            {!isSignup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {isSignup && (
              <>
                {role === 'CONSUMER' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Nairobi, Kenya"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <Button className="w-full py-3" onClick={handleSubmit}>
              {isSignup ? (role === 'PROVIDER' ? 'Continue to Profile Setup' : 'Create Account') : 'Sign In'}
            </Button>
          </div>

          {!isSignup && (
            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-wider font-semibold italic">Sign in with your registered credentials</p>
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
  const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<{ isSignup: boolean, role: UserRole }>({
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed');
        return;
      }

      const user: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        location: data.location,
        avatar: data.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
        status: data.status || 'ACTIVE',
        verified: data.verified || false
      };

      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', data.token);
      setCurrentView('dashboard');
      setIsLoginOpen(false);
      setIsOnboarding(false);
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error during login');
    }
  };

  const handleSignup = async (role: UserRole, email: string, name: string, location: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, location })
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors properly
        if (data.errors) {
          const errorMessages = Object.values(data.errors).join(', ');
          alert(errorMessages);
        } else {
          alert(data.message || 'Signup failed');
        }
        return;
      }

      const newUser: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        location: data.location,
        avatar: data.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
        status: data.status || 'ACTIVE',
        verified: data.verified || false
      };

      setCurrentUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', data.token);
      setIsLoginOpen(false);

      if (role === 'PROVIDER') {
        setIsOnboarding(true);
      } else {
        setIsOnboarding(false);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Cannot connect to backend server. Please ensure the backend is running on port 5000.');
      } else {
        alert('Network error during signup. Please try again.');
      }
    }
  };

  const handleProfileUpdate = (updatedProfile: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedProfile } as User);
      setIsOnboarding(false);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentView('dashboard');
    setIsOnboarding(false);
    setActiveChatTarget(null);
  };

  const handleMessageUser = (userId: string) => {
    setActiveChatTarget(userId);
    setCurrentView('messages');
  };

  // Onboarding View
  if (currentUser && isOnboarding) {
    return <Onboarding user={currentUser} onComplete={handleProfileUpdate} />;
  }

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    if (!currentUser) return null;

    if (currentView === 'messages') {
      return <ChatInterface user={currentUser} initialTargetId={activeChatTarget} />;
    }

    switch (currentUser.role) {
      case 'CONSUMER':
        return <ConsumerDashboard user={currentUser} currentView={currentView} onUpdate={handleProfileUpdate} onMessageProvider={handleMessageUser} />;
      case 'PROVIDER':
        return <ProviderDashboard user={currentUser} currentView={currentView} onUpdate={handleProfileUpdate} onMessageUser={handleMessageUser} />;
      case 'ADMIN':
        return <AdminDashboard user={currentUser} currentView={currentView} />;
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
