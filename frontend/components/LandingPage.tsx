import React, { useState } from 'react';
import { Button } from './Layout';
import { 
  Shield, CreditCard, Calendar, Search, MessageSquare, CheckCircle, 
  Menu, X, Facebook, Twitter, Youtube, ArrowRight, MapPin
} from 'lucide-react';

interface LandingPageProps {
  onAuthAction: (mode: 'login' | 'signup', role?: 'CONSUMER' | 'PROVIDER') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthAction }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden scroll-smooth">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center space-x-2 rtl:space-x-reverse">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
             </div>
             <span className="self-center text-xl font-bold whitespace-nowrap text-white">LocalLink</span>
          </a>
          
          <div className="flex md:order-2 space-x-3 md:space-x-4 rtl:space-x-reverse">
             <Button variant="ghost" onClick={() => onAuthAction('login')} className="text-slate-300 hover:text-white">Log In</Button>
             <Button onClick={() => onAuthAction('signup', 'CONSUMER')} className="hidden md:flex">Sign Up</Button>
             <button 
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-slate-400 rounded-lg md:hidden hover:bg-slate-800 focus:outline-none"
             >
                {mobileMenuOpen ? <X /> : <Menu />}
             </button>
          </div>

          <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-slate-800 rounded-lg bg-slate-900 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
              <li><a href="#" className="block py-2 px-3 text-slate-400 rounded hover:bg-slate-800 md:hover:bg-transparent md:hover:text-white md:p-0 transition-colors">How It Works</a></li>
              <li><a href="#" className="block py-2 px-3 text-slate-400 rounded hover:bg-slate-800 md:hover:bg-transparent md:hover:text-white md:p-0 transition-colors">About</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12 relative z-10">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight leading-none text-white md:text-6xl lg:text-7xl">
            Your Local Connection for <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Trusted Services</span>
          </h1>
          <p className="mb-8 text-lg font-normal text-slate-400 lg:text-xl sm:px-16 xl:px-48">
            Instantly find skilled local professionals or grow your service business in your community.
          </p>
          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <Button onClick={() => onAuthAction('signup', 'CONSUMER')} className="px-8 py-4 text-base h-auto rounded-xl">Find a Service</Button>
            <Button onClick={() => onAuthAction('signup', 'PROVIDER')} variant="secondary" className="px-8 py-4 text-base h-auto rounded-xl bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800">Offer Your Service</Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need, all in one place</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">LocalLink makes it simple and secure to connect with the right people for any job.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified Providers", desc: "Connect with confidence. All our service providers are vetted for quality and reliability." },
              { icon: CreditCard, title: "Secure Payments", desc: "Pay for services securely through our platform with transparent pricing and no hidden fees." },
              { icon: Calendar, title: "Easy Booking", desc: "Schedule appointments, manage your calendar, and communicate with ease, all in one app." },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-slate-700 transition-colors">
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-6 text-blue-500">
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Getting started with LocalLink is as easy as one, two, three.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: Search, step: "1. Discover", title: "Search or browse our categories to find the perfect local professional for your needs." },
               { icon: MessageSquare, step: "2. Connect", title: "Book a service, chat directly, and manage all your appointments in one place." },
               { icon: CheckCircle, step: "3. Succeed", title: "Complete your project with a trusted pro, and leave a review to help the community." }
             ].map((item, i) => (
               <div key={i} className="p-6 text-center md:text-left">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-600/30 flex items-center justify-center text-blue-500 mb-6 mx-auto md:mx-0">
                    <item.icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.step}</h3>
                  <p className="text-slate-400">{item.title}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Trusted by Your Neighbors</h2>
            <p className="text-slate-400">See what people are saying about their experiences with LocalLink professionals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                text: "I found a great plumber in minutes! The whole process was seamless, from booking to payment. Highly recommended for any homeowner.",
                name: "John D.",
                role: "Homeowner",
                img: "https://randomuser.me/api/portraits/men/32.jpg"
              },
              { 
                text: "LocalLink helped me double my client base in just three months. The platform is intuitive and brings serious customers directly to me.",
                name: "Maria S.",
                role: "Landscaper",
                img: "https://randomuser.me/api/portraits/women/44.jpg"
              },
              { 
                text: "As a freelance designer, managing clients and payments was a hassle. Now, everything is in one place. It's a game-changer for my business!",
                name: "Chloe R.",
                role: "Graphic Designer",
                img: "https://randomuser.me/api/portraits/women/68.jpg"
              }
            ].map((t, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <p className="text-slate-300 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border border-slate-700" />
                  <div>
                    <h4 className="font-bold text-white">{t.name}</h4>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto bg-blue-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-10 text-lg max-w-2xl mx-auto">Join the LocalLink community today. Whether you're looking for help or looking to grow your business, we've got you covered.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => onAuthAction('signup', 'CONSUMER')} className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors">Find a Service</button>
              <button onClick={() => onAuthAction('signup', 'PROVIDER')} className="px-8 py-3 bg-blue-700 text-white border border-blue-500 rounded-xl font-bold hover:bg-blue-800 transition-colors">Offer Your Service</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
               <div className="flex items-center space-x-2 mb-4">
                 <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-3 h-3 border border-white rounded-full"></div>
                 </div>
                 <span className="font-bold text-lg text-white">LocalLink</span>
               </div>
               <p className="text-slate-500 text-sm leading-relaxed">Connecting communities, one service at a time.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">For Consumers</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => onAuthAction('signup', 'CONSUMER')} className="hover:text-blue-500">Find a Pro</button></li>
                <li><a href="#" className="hover:text-blue-500">How It Works</a></li>
                <li><a href="#" className="hover:text-blue-500">Trust & Safety</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">For Providers</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => onAuthAction('signup', 'PROVIDER')} className="hover:text-blue-500">Join as a Pro</button></li>
                <li><a href="#" className="hover:text-blue-500">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-500">Resources</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-500">About Us</a></li>
                <li><a href="#" className="hover:text-blue-500">Careers</a></li>
                <li><a href="#" className="hover:text-blue-500">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800">
            <p className="text-slate-600 text-xs mb-4 md:mb-0">© 2024 LocalLink. All rights reserved.</p>
            <div className="flex space-x-4 mb-4 md:mb-0">
               <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"><Facebook size={16}/></div>
               <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"><Twitter size={16}/></div>
               <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"><Youtube size={16}/></div>
            </div>
            <div className="flex space-x-6 text-xs text-slate-500">
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};