import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Layout';
import { Send, Image, MoreVertical, Phone, Video, CheckCheck, Smile, Paperclip, Loader2, MessageSquare } from 'lucide-react';
import { cn, Button } from './Layout';
import { User, ChatContact, ChatMessage } from '../types';
import { getSocket, joinUserRoom } from '../services/socketService';

interface ChatInterfaceProps {
  user: User;
  initialTargetId?: string | null;
}

const formatMessageTime = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toChatMessage = (message: any): ChatMessage => ({
  id: String(message?._id || message?.id || ''),
  senderId: String(message?.sender || message?.senderId || ''),
  text: String(message?.text || ''),
  timestamp: formatMessageTime(message?.createdAt || message?.timestamp),
  isImage: Boolean(message?.isImage),
  clientId: typeof message?.clientId === 'string' ? message.clientId : undefined,
  deliveryState: 'sent',
  createdAt: typeof message?.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
});

const mergeMessage = (messages: ChatMessage[], incoming: ChatMessage) => {
  const existingIndex = messages.findIndex((message) => {
    if (incoming.id && message.id === incoming.id) {
      return true;
    }
    return Boolean(incoming.clientId) && message.clientId === incoming.clientId;
  });

  if (existingIndex === -1) {
    return [...messages, incoming];
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...incoming,
  };
  return nextMessages;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, initialTargetId }) => {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(initialTargetId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState({ contacts: true, messages: false });
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const activeChatRef = useRef<string | null>(initialTargetId || null);

  const currentChat = contacts.find(c => c.id === activeChat);

  // Fetch Contacts
  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to load conversations.');
      }

      setContacts(data);

      // If we have an initial target but it's not in contacts yet, we might need to fetch its info
      if (initialTargetId && !data.find((c: any) => c.id === initialTargetId)) {
        // This handles cases where we start a chat with someone we haven't messaged before
        const userRes = await fetch(`/api/users/${initialTargetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          const newContact: ChatContact = {
            id: userData._id,
            name: userData.name,
            avatar: userData.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
            lastMessage: '',
            lastMessageTime: '',
            unread: 0,
            online: userData.status === 'ACTIVE'
          };
          setContacts(prev => [newContact, ...prev]);
        }
      }

      if (!activeChat && data.length > 0 && !initialTargetId) {
        setActiveChat(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(prev => ({ ...prev, contacts: false }));
    }
  };

  // Fetch Messages
  const fetchMessages = async (userId: string) => {
    if (!userId) return;
    try {
      setLoading(prev => ({ ...prev, messages: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to load messages.');
      }

      const formattedMessages = Array.isArray(data) ? data.map((message: any) => toChatMessage(message)) : [];

      setMessages((prev) => {
        const pendingMessages = prev.filter((message) => message.deliveryState === 'sending' && message.threadId === userId);
        return formattedMessages.reduce((nextMessages, message) => mergeMessage(nextMessages, message), pendingMessages);
      });

      // Mark as read
      await fetch(`/api/chat/read/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat || isSending) return;

    const text = input.trim();
    const receiverId = activeChat;
    const clientId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const optimisticMessage: ChatMessage = {
      id: `temp-${clientId}`,
      senderId: user.id,
      text,
      timestamp: formatMessageTime(),
      isImage: false,
      clientId,
      deliveryState: 'sending',
      createdAt: new Date().toISOString(),
      threadId: receiverId,
    };

    setInput('');
    setSendError(null);
    setIsSending(true);
    setMessages((prev) => mergeMessage(prev, optimisticMessage));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          text,
          clientId,
        })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to send message.');
      }

      setMessages((prev) => mergeMessage(prev, toChatMessage(data)));
      fetchContacts();
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error instanceof Error ? error.message : 'Failed to send message.';
      setSendError(message);
      setMessages((prev) => prev.filter((messageItem) => messageItem.clientId !== clientId));
      setInput((current) => current || text);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    joinUserRoom(user.id);
    const socket = getSocket();

    const handleLiveMessage = (message: any) => {
      if (!message) return;

      const senderId = String(message.sender || '');
      const receiverId = String(message.receiver || '');
      const myId = user.id;
      const otherId = senderId === myId ? receiverId : senderId;
      const isForMe = senderId === myId || receiverId === myId;
      if (!isForMe) return;

      setContacts((prev) => {
        const exists = prev.some((contact) => contact.id === otherId);
        if (exists) return prev;
        return [
          {
            id: otherId,
            name: 'New Contact',
            avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
            lastMessage: '',
            lastMessageTime: '',
            unread: 0,
            online: false,
          },
          ...prev,
        ];
      });

      const isActiveThread = activeChatRef.current === otherId;
      if (isActiveThread) {
        setMessages((prev) => {
          return mergeMessage(prev, toChatMessage(message));
        });
      }

      fetchContacts();
      if (isActiveThread && senderId !== myId) {
        const token = localStorage.getItem('token');
        fetch(`/api/chat/read/${otherId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    };

    socket.on('chat:message', handleLiveMessage);
    return () => {
      socket.off('chat:message', handleLiveMessage);
    };
  }, [user.id]);

  useEffect(() => {
    fetchContacts();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      setSendError(null);
      fetchMessages(activeChat);

      // Fallback polling in case realtime transport is unavailable
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeChat);
        fetchContacts();
      }, 5000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            {loading.contacts ? (
              <div className="flex items-center justify-center p-8 text-slate-500">
                <Loader2 size={24} className="animate-spin mr-2" /> Loading...
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                No conversations yet. Start messaging providers to see them here!
              </div>
            ) : (
              contacts.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={cn(
                    "p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors border-l-2",
                    activeChat === chat.id ? "bg-slate-800/80 border-blue-500" : "border-transparent text-slate-400 font-medium"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-700 shadow-lg" />
                    {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={cn("font-bold text-sm truncate", activeChat === chat.id ? "text-white" : "text-slate-200")}>{chat.name}</h4>
                      <span className="text-[10px] text-slate-500 font-medium">{chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleDateString() : ''}</span>
                    </div>
                    <p className={cn("text-xs truncate", chat.unread > 0 ? "text-blue-400 font-bold" : "text-slate-500 font-normal")}>
                      {chat.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold ml-1">
                      {chat.unread}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {activeChat ? (
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
                <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><Phone size={20} /></button>
                <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><Video size={20} /></button>
                <button className="p-2 hover:bg-slate-800 hover:text-white rounded-full transition-all"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-950/20 custom-scrollbar flex flex-col">
              {messages.length === 0 && !loading.messages ? (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-500 gap-4 opacity-50">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                    <MessageSquare size={32} />
                  </div>
                  <p>Start your conversation with {currentChat?.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] md:max-w-[70%]", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-3 shadow-md relative",
                          msg.deliveryState === 'sending' && "opacity-80",
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-[#1f2937] text-slate-200 rounded-bl-none border border-slate-800"
                        )}>
                          {msg.isImage ? (
                            <div className="mb-1 rounded-xl overflow-hidden border-4 border-blue-600 shadow-xl bg-blue-600">
                              <img src={msg.text} className="w-full h-auto max-h-[300px] object-cover" alt="attachment" />
                            </div>
                          ) : (
                            <p className="text-sm md:text-[15px] leading-relaxed">{msg.text}</p>
                          )}
                          <div className={cn("flex items-center gap-1.5 mt-1 justify-end opacity-60")}>
                            <span className="text-[10px] font-medium tracking-wide">{msg.timestamp}</span>
                            {isMe && msg.deliveryState === 'sending' ? (
                              <Loader2 size={12} className="animate-spin text-blue-100" />
                            ) : null}
                            {isMe && msg.deliveryState !== 'sending' ? <CheckCheck size={14} className="text-blue-100" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
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
                      if (e.key === 'Enter' && input.trim() && !isSending) {
                        handleSend();
                      }
                    }}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 p-1">
                    <Smile size={20} />
                  </button>
                </div>

                <button
                  onClick={handleSend}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all flex items-center justify-center flex-shrink-0 shadow-lg",
                    input.trim() && !isSending
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40"
                      : "bg-slate-800 text-slate-500"
                  )}
                  disabled={!input.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} className={cn(input.trim() ? "translate-x-0.5" : "")} />
                  )}
                </button>
              </div>
              {sendError && (
                <p className="max-w-4xl mx-auto mt-2 px-2 text-xs text-red-400">{sendError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 gap-6">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 border border-slate-700 shadow-inner">
              <MessageSquare size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Direct Messages</h2>
              <p className="max-w-xs mx-auto">Select a contact from the left or browse services to start a new chat with a local professional.</p>
            </div>
            <Button variant="secondary">Browse Services</Button>
          </div>
        )}
      </div>
    </div>
  );
};
