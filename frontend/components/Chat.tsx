import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Layout';
import { MOCK_CHATS, MOCK_MESSAGES } from '../constants';
import { Send, Image, MoreVertical, Phone, Video, CheckCheck, Smile, Paperclip } from 'lucide-react';
import { cn } from './Layout';

export const ChatInterface = () => {
  const [activeChat, setActiveChat] = useState(MOCK_CHATS[0].id);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = MOCK_CHATS.find(c => c.id === activeChat);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [MOCK_MESSAGES]);

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Contact List */}
      <div className="w-80 flex-shrink-0 hidden lg:flex flex-col gap-4 h-full">
        <Card noPadding className="h-full flex flex-col bg-slate-900/50 border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-all" 
              placeholder="Search conversations..." 
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {MOCK_CHATS.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors border-l-2",
                  activeChat === chat.id ? "bg-slate-800/80 border-blue-500" : "border-transparent text-slate-400"
                )}
              >
                <div className="relative flex-shrink-0">
                   <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-700 shadow-lg" />
                   {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={cn("font-bold text-sm truncate", activeChat === chat.id ? "text-white" : "text-slate-200")}>{chat.name}</h4>
                    <span className="text-[10px] text-slate-500 font-medium">{chat.lastMessageTime}</span>
                  </div>
                  <p className={cn("text-xs truncate", chat.unread > 0 ? "text-blue-400 font-semibold" : "text-slate-500")}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md z-30">
             <div className="flex items-center gap-3">
               <div className="relative flex-shrink-0">
                 <img src={currentChat?.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                 {currentChat?.online && <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>}
               </div>
               <div>
                 <h3 className="font-bold text-white text-base tracking-tight leading-tight">{currentChat?.name}</h3>
                 <p className={cn("text-xs flex items-center gap-1 font-semibold", currentChat?.online ? 'text-emerald-500' : 'text-slate-500')}>
                   {currentChat?.online ? 'Online' : 'Offline'}
                 </p>
               </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
               <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><Phone size={20}/></button>
               <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><Video size={20}/></button>
               <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><MoreVertical size={20}/></button>
             </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-950/20 custom-scrollbar flex flex-col">
             {MOCK_MESSAGES.map((msg) => {
               const isMe = msg.senderId === 'u1';
               return (
                 <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] md:max-w-[70%]", isMe ? "items-end" : "items-start")}>
                       <div className={cn(
                         "rounded-2xl px-4 py-3 shadow-md relative",
                         isMe 
                           ? "bg-blue-600 text-white rounded-br-none" 
                           : "bg-[#1f2937] text-slate-200 rounded-bl-none border border-slate-800"
                       )}>
                          {msg.isImage ? (
                            <div className="mb-1 rounded-xl overflow-hidden border-4 border-blue-600 shadow-xl bg-blue-600">
                               <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" className="w-full h-auto max-h-[300px] object-cover" alt="attachment" />
                            </div>
                          ) : (
                            <p className="text-sm md:text-[15px] leading-relaxed">{msg.text}</p>
                          )}
                          <div className={cn("flex items-center gap-1.5 mt-1 justify-end opacity-60")}>
                             <span className="text-[10px] font-medium tracking-wide">{msg.timestamp}</span>
                             {isMe && <CheckCheck size={14} className="text-blue-100" />}
                          </div>
                       </div>
                    </div>
                 </div>
               )
             })}
             <div ref={messagesEndRef} />
          </div>

          {/* Fixed Bottom Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 z-30">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <div className="flex items-center">
                <button className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                  <Paperclip size={20} />
                </button>
                <button className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                  <Image size={20} />
                </button>
              </div>
              
              <div className="flex-1 relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-full pl-5 pr-12 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder-slate-600 shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      setInput('');
                    }
                  }}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 p-1">
                  <Smile size={20} />
                </button>
              </div>

              <button 
                className={cn(
                  "w-10 h-10 rounded-full transition-all flex items-center justify-center flex-shrink-0 shadow-lg",
                  input.trim() 
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40" 
                    : "bg-slate-800 text-slate-500"
                )}
                disabled={!input.trim()}
              >
                <Send size={18} className={cn(input.trim() ? "translate-x-0.5" : "")} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};