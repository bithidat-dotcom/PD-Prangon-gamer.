import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Auth from './components/Auth';
import { Compass, MessageCircle, User, LogOut, Video, Phone, Image, Search } from 'lucide-react';
import DiscoverUsers from './components/DiscoverUsers';
import ChatSection from './components/ChatSection';
import StorySection from './components/StorySection';
import UserProfile from './components/UserProfile';
import { usePeer } from './hooks/usePeer';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<'home' | 'stories' | 'messages' | 'profile'>('home');
  const { callState, startCall, answerCall, endCall } = usePeer(user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Conector User',
            photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`,
            phoneNumber: '',
            bio: '',
            connections: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen max-w-7xl mx-auto bg-black text-white">
      {/* Desktop Sidebar / Mobile Nav Branding */}
      <aside className="hidden md:flex w-64 flex-col p-4 h-screen sticky top-0 border-r border-x-border">
        <div className="mb-10 px-4 flex items-center gap-4">
          <img 
            src="https://i.ibb.co.com/d0LcTMfR/Dmitri-dmiiiitri-on-X.jpg" 
            alt="Conector" 
            className="w-10 h-10 rounded-xl shadow-lg border border-white/5" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=C&background=fff&color=000&bold=true&size=128';
            }}
          />
          <h1 className="text-2xl font-black tracking-tighter">CONECTOR</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<Compass />} label="Explore" active={page === 'home'} onClick={() => setPage('home')} />
          <SidebarItem icon={<Image />} label="Stories" active={page === 'stories'} onClick={() => setPage('stories')} />
          <SidebarItem icon={<MessageCircle />} label="Messages" active={page === 'messages'} onClick={() => setPage('messages')} />
          <SidebarItem icon={<User />} label="Profile" active={page === 'profile'} onClick={() => setPage('profile')} />
        </nav>

        <div className="mt-auto p-3 rounded-full hover:bg-x-hover cursor-pointer transition-colors flex items-center gap-3" onClick={() => auth.signOut()}>
          <img src={user.photoURL} className="w-10 h-10 rounded-full" />
          <div className="flex-1 truncate">
            <p className="font-bold truncate">{user.displayName}</p>
            <p className="text-x-gray text-xs truncate">Log out</p>
          </div>
          <LogOut size={18} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 border-r border-x-border min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-x-border flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{page === 'home' ? 'Discover Users' : page}</h2>
          <div className="md:hidden text-sm font-black tracking-tighter">CONECTOR</div>
        </header>
        
        <div className="p-0 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {page === 'home' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="home">
                <DiscoverUsers user={user} />
              </motion.div>
            )}
            {page === 'stories' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="stories">
                <StorySection user={user} />
              </motion.div>
            )}
            {page === 'messages' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="messages">
                <ChatSection user={user} startCall={startCall} />
              </motion.div>
            )}
            {page === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="profile">
                <UserProfile user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Task Bar (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-x-border flex items-center justify-around z-50">
        <MobileNavItem icon={<Compass />} active={page === 'home'} onClick={() => setPage('home')} />
        <MobileNavItem icon={<Image />} active={page === 'stories'} onClick={() => setPage('stories')} />
        <MobileNavItem icon={<MessageCircle />} active={page === 'messages'} onClick={() => setPage('messages')} />
        <MobileNavItem icon={<User />} active={page === 'profile'} onClick={() => setPage('profile')} />
      </nav>

      {/* Call UI */}
      {callState.incoming && <CallNotification onAccept={answerCall} onReject={endCall} from={callState.remoteUid || 'User'} />}
      {callState.active && <VideoOverlay stream={callState.stream} onEnd={endCall} />}
    </div>
  );
}

function MobileNavItem({ icon, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`p-4 rounded-full transition-all ${active ? 'bg-x-hover text-white scale-110' : 'text-zinc-500'}`}>
      <div className={`${active ? 'text-white' : 'text-zinc-500'}`}>
        {React.cloneElement(icon, { size: 24, className: active ? 'fill-current' : '' })}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-full cursor-pointer transition-all duration-200 hover:bg-x-hover ${active ? 'font-black bg-x-hover/30' : 'font-medium'}`}
    >
      <div className="text-white">{React.cloneElement(icon, { size: 24, className: active ? 'fill-current' : '' })}</div>
      <span className="text-lg hidden md:block">{label}</span>
    </div>
  );
}

function TrendItem({ title, posts }: any) {
  return (
    <div className="py-3 hover:bg-white/5 cursor-pointer px-2 transition-colors rounded-lg">
      <p className="text-xs text-x-gray">Trending</p>
      <p className="font-bold">{title}</p>
      <p className="text-xs text-x-gray">{posts} Posts</p>
    </div>
  );
}

function CallNotification({ onAccept, onReject, from }: any) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-x-blue p-6 rounded-2xl shadow-2xl flex items-center gap-6 z-[100] border-2 border-white/20"
    >
      <div>
        <p className="text-sm font-medium opacity-80">Incoming call from</p>
        <p className="text-lg font-bold">@{from.substring(0, 8)}...</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onReject} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg">
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </button>
        <button onClick={onAccept} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors shadow-lg">
          <Video className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}

function VideoOverlay({ stream, onEnd }: any) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-4 md:p-8"
    >
      <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
          <button onClick={onEnd} className="p-5 bg-red-500 rounded-full hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-xl">
            <Phone className="w-8 h-8 rotate-[135deg]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
