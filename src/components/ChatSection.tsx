import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, doc, updateDoc, 
  setDoc, arrayUnion, getDoc 
} from 'firebase/firestore';
import { 
  Search, Settings, MessageSquarePlus, Send, 
  Video, Phone, Plus, Users, Shield, Mic, 
  ChevronLeft, Info
} from 'lucide-react';
import { Chat, Message, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatSection({ user, startCall }: { user: any, startCall: any }) {
  const [chats, setChats] = useState<(Chat & { otherUser?: User })[]>([]);
  const [selectedChat, setSelectedChat] = useState<(Chat & { otherUser?: User }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [isFirstTimePromptOpen, setIsFirstTimePromptOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[];
      
      // Enrich private chats with other user's data
      const enrichedChats = await Promise.all(chatData.map(async chat => {
        if (!chat.isGroup) {
          const otherUid = chat.participants.find(p => p !== user.uid);
          if (otherUid) {
            const uSnap = await getDoc(doc(db, 'users', otherUid));
            if (uSnap.exists()) {
              return { ...chat, otherUser: uSnap.data() as User };
            }
          }
        }
        return chat;
      }));

      setChats(enrichedChats);
    });
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, `chats/${selectedChat.id}/messages`), 
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    });
    return unsubscribe;
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const encrypted = encryptMessage(newMessage, selectedChat.id);
    try {
      await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
        chatId: selectedChat.id,
        senderId: user.uid,
        content: encrypted,
        type: 'text',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: newMessage,
        updatedAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  const createChat = async (otherUser: User) => {
    const chatId = [user.uid, otherUser.uid].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDocs(query(collection(db, 'chats'), where('participants', '==', [user.uid, otherUser.uid].sort())));
    
    if (chatSnap.empty) {
      await setDoc(chatRef, {
        participants: [user.uid, otherUser.uid].sort(),
        updatedAt: serverTimestamp(),
        isGroup: false,
      });
    }
    setSelectedChat({ id: chatId, participants: [user.uid, otherUser.uid], updatedAt: new Date(), isGroup: false });
    setFoundUsers([]);
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const res = await addDoc(collection(db, 'chats'), {
        name: groupName,
        participants: [user.uid],
        ownerId: user.uid,
        isGroup: true,
        updatedAt: serverTimestamp(),
      });
      setIsGroupModalOpen(false);
      setGroupName('');
      setSelectedChat({ id: res.id, name: groupName, participants: [user.uid], isGroup: true, updatedAt: new Date() });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* List */}
      <div className={`w-full md:w-80 border-r border-x-border flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-x-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">Messages</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsGroupModalOpen(true)} title="New Group" className="p-2.5 hover:bg-x-hover rounded-xl transition-colors border border-white/5">
                <Users size={20} className="text-x-blue" />
              </button>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-x-gray group-focus-within:text-x-blue transition-colors" size={18} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Find people by name..." 
              value={searchUser}
              className={`w-full bg-[#16181c] rounded-2xl py-3 pl-12 pr-4 outline-none transition-all text-sm font-medium border ${isFirstTimePromptOpen ? 'ring-4 ring-x-blue/20 border-x-blue shadow-[0_0_20px_rgba(29,155,240,0.2)]' : 'border-white/5 focus:ring-2 focus:ring-x-blue/50'}`}
              onChange={async (e) => {
                const val = e.target.value;
                setSearchUser(val);
                if (val.length > 1) {
                   const q = query(collection(db, 'users'), where('displayName', '>=', val), where('displayName', '<=', val + '\uf8ff'));
                   const snap = await getDocs(q);
                   setFoundUsers(snap.docs.map(d => d.data()) as User[]);
                } else {
                  setFoundUsers([]);
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {foundUsers.length > 0 && (
            <div className="p-2 bg-x-blue/10 border-b border-x-border">
              <p className="text-xs font-black text-x-blue mb-3 uppercase tracking-[0.2em] px-3 mt-2">New conversation</p>
              {foundUsers.map(u => (
                <div key={u.uid} onClick={() => createChat(u)} className="flex items-center gap-3 p-3 hover:bg-x-hover cursor-pointer rounded-2xl transition-all mb-1 border border-transparent hover:border-white/5">
                  <img src={u.photoURL} className="w-12 h-12 rounded-full border border-white/10" />
                  <div>
                    <p className="font-bold text-sm">{u.displayName}</p>
                    <p className="text-[10px] text-x-gray uppercase font-black">Click to chat</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {chats.length === 0 && !searchUser && (
             <div className="p-8 text-center">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                   <MessageSquarePlus className="text-x-gray" />
                </div>
                <p className="text-sm font-bold text-x-gray">No messages yet.</p>
                <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">Connect with friends to start chatting</p>
             </div>
          )}
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-4 hover:bg-x-hover cursor-pointer border-l-4 transition-all duration-200 ${selectedChat?.id === chat.id ? 'border-x-blue bg-x-hover/50' : 'border-transparent'}`}
            >
              <div className="relative">
                <img 
                  src={chat.isGroup ? "https://ui-avatars.com/api/?name=Group&background=1d9bf0&color=fff" : chat.otherUser?.photoURL || `https://ui-avatars.com/api/?name=${chat.id}`} 
                  className="w-12 h-12 rounded-full ring-2 ring-x-border object-cover" 
                />
                {!chat.isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />}
                {chat.isGroup && <Users className="absolute -bottom-1 -right-1 bg-x-blue p-1 rounded-full text-white w-5 h-5 border-2 border-black" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold truncate">{chat.name || chat.otherUser?.displayName || "Private Chat"}</span>
                  <span className="text-[10px] uppercase font-black text-x-gray">{chat.updatedAt ? formatDistanceToNow(chat.updatedAt.toDate(), { addSuffix: false }) : ''}</span>
                </div>
                <p className="text-sm text-x-gray truncate">{chat.lastMessage || 'No messages yet'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col bg-black relative ${!selectedChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!selectedChat ? (
          <div className="text-center p-8 max-w-sm">
             <div className="mb-6 w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
               <MessageSquarePlus size={48} className="text-x-blue" />
             </div>
             <h2 className="text-3xl font-black mb-3 tracking-tighter">Your Messages</h2>
             <p className="text-x-gray font-medium">Choose from your existing conversations, or start a new one with your friends.</p>
             <button 
               onClick={() => {
                 searchInputRef.current?.focus();
                 setIsFirstTimePromptOpen(true);
                 setTimeout(() => setIsFirstTimePromptOpen(false), 2000);
               }}
               className="mt-8 bg-x-blue text-white font-black px-10 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl"
             >
               New message
             </button>
          </div>
        ) : (
          <>
            <header className="p-3 border-b border-x-border flex items-center justify-between bg-black/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 hover:bg-x-hover rounded-full">
                  <ChevronLeft />
                </button>
                <img src={selectedChat.isGroup ? "https://ui-avatars.com/api/?name=Group&background=1d9bf0&color=fff" : selectedChat.otherUser?.photoURL || `https://ui-avatars.com/api/?name=${selectedChat.id}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold">{selectedChat.name || selectedChat.otherUser?.displayName || "Private Chat"}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-green-500">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startCall(selectedChat.participants.find(p => p !== user.uid), 'voice')} className="p-2.5 hover:bg-x-hover rounded-full text-x-blue transition-colors">
                  <Phone size={20} />
                </button>
                <button onClick={() => startCall(selectedChat.participants.find(p => p !== user.uid), 'video')} className="p-2.5 hover:bg-x-hover rounded-full text-x-blue transition-colors">
                  <Video size={20} />
                </button>
                <button className="p-2.5 hover:bg-x-hover rounded-full text-x-gray transition-colors">
                  <Info size={20} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
              <div className="flex flex-col items-center mb-8 py-8 opacity-60">
                <Shield className="w-12 h-12 mb-2 text-x-blue" />
                <p className="text-xs font-bold uppercase tracking-widest text-x-blue">End-to-End Encrypted</p>
                <p className="text-[11px] text-center max-w-xs mt-2 text-x-gray">Messages are secured with AES-256. Not even X-Sphere can read them.</p>
              </div>
              
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3 px-4 shadow-sm relative group ${
                      msg.senderId === user.uid 
                        ? 'bg-x-blue text-white rounded-br-sm' 
                        : 'bg-x-border text-white rounded-bl-sm'
                    }`}>
                      <p className="text-[15px]">{decryptMessage(msg.content, selectedChat.id)}</p>
                      <span className="text-[10px] opacity-50 block mt-1">
                        {msg.createdAt && new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            <footer className="p-4 border-t border-x-border bg-black/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 bg-x-border/40 p-2 pl-4 rounded-3xl border border-white/5 focus-within:border-x-blue transition-all">
                <Plus className="text-x-blue cursor-pointer hover:scale-110 transition-transform" />
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Start a new message"
                  className="flex-1 bg-transparent outline-none py-1.5 text-[15px]"
                />
                <Mic className="text-x-blue cursor-pointer hover:scale-110 transition-transform" size={20} />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-x-blue rounded-full text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Send size={18} className="translate-x-0.5" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border border-x-border rounded-3xl p-8 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-2xl font-extrabold mb-6">Create New Group</h2>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#16181c] border border-x-border rounded-xl p-4 text-white outline-none focus:ring-1 focus:ring-x-blue mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="flex-1 font-bold py-3 px-6 rounded-full border border-x-border hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!groupName.trim()}
                onClick={createGroup}
                className="flex-1 bg-white text-black font-extrabold py-3 px-6 rounded-full disabled:opacity-50 hover:bg-gray-200 transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
