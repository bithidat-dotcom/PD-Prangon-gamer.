import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Check, User as UserIcon, Phone, FileText, MoreVertical, BellOff, Trash2, ShieldAlert, X } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function DiscoverUsers({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<string[]>([]);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const currentUserId = user.id || user.uid;

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (data) {
        setUsers(data.filter(u => (u.id || u.uid) !== currentUserId));
      }
    };

    const fetchUserDetails = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (data) {
        setConnections(data.connections || []);
        setMutedUsers(data.muted_users || data.mutedUsers || []);
        setBlockedUsers(data.blocked_users || data.blockedUsers || []);
      }
    };

    fetchUsers();
    fetchUserDetails();

    // Set up real-time subscription for users table
    const usersSubscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
        fetchUserDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
    };
  }, [currentUserId]);

  const handleConnect = async (targetUid: string) => {
    const newConnections = [...connections, targetUid];
    const { error } = await supabase
      .from('users')
      .update({ 
        connections: newConnections,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUserId);
    
    if (!error) {
      setConnections(newConnections);
    }
  };

  const handleAction = async (targetUid: string, action: 'mute' | 'delete' | 'block') => {
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (action === 'mute') {
      const newMuted = [...mutedUsers, targetUid];
      updates.muted_users = newMuted;
      setMutedUsers(newMuted);
    } else if (action === 'block') {
      const newBlocked = [...blockedUsers, targetUid];
      updates.blocked_users = newBlocked;
      setBlockedUsers(newBlocked);
      const newConnections = connections.filter(id => id !== targetUid);
      updates.connections = newConnections;
      setConnections(newConnections);
    } else if (action === 'delete') {
      const newConnections = connections.filter(id => id !== targetUid);
      updates.connections = newConnections;
      setConnections(newConnections);
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUserId);

    if (!error) {
      setActiveMenu(null);
    } else {
      console.error(error);
    }
  };

  const isConnected = (uid: string) => connections.includes(uid);
  const isBlocked = (uid: string) => blockedUsers.includes(uid);

  // Group users into "Connected" and "Suggestions"
  const connectedUsers = users.filter(u => isConnected(u.id || u.uid) && !isBlocked(u.id || u.uid));
  const suggestedUsers = users.filter(u => !isConnected(u.id || u.uid) && !isBlocked(u.id || u.uid));

  return (
    <div className="w-full">
      {connectedUsers.length > 0 && (
        <section className="p-4 bg-x-blue/5 border-b border-x-border">
          <h3 className="text-sm font-black text-x-blue uppercase tracking-widest mb-4 px-2">Connected</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
            {connectedUsers.map(u => (
              <div 
                key={u.id || u.uid} 
                className="flex flex-col items-center gap-1 min-w-[70px] group relative"
              >
                <div onClick={() => setSelectedUser(u)} className="relative cursor-pointer">
                  <img src={u.photo_url || u.photoURL} className="w-16 h-16 rounded-full border-2 border-x-blue group-hover:scale-105 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black" />
                </div>
                <span className="text-xs font-bold truncate w-full text-center">{(u.display_name || u.displayName).split(' ')[0]}</span>
                
                {/* Options Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === (u.id || u.uid) ? null : (u.id || u.uid));
                  }}
                  className="absolute -top-1 -right-1 p-1 bg-zinc-800 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <MoreVertical size={12} />
                </button>

                {/* Options Menu */}
                <AnimatePresence>
                  {activeMenu === (u.id || u.uid) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-8 left-0 min-w-[140px] bg-zinc-800 rounded-2xl shadow-2xl border border-white/10 z-[100] overflow-hidden"
                    >
                      <button onClick={() => handleAction(u.id || u.uid, 'mute')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                        <BellOff size={14} className="text-x-gray" /> Mute
                      </button>
                      <button onClick={() => handleAction(u.id || u.uid, 'delete')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                        <Trash2 size={14} className="text-x-gray" /> Delete
                      </button>
                      <button onClick={() => handleAction(u.id || u.uid, 'block')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2 border-t border-white/5 text-red-400">
                        <ShieldAlert size={14} /> Block
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Global Click Handler to close menu */}
      {activeMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setActiveMenu(null)} />
      )}

      <section className="p-4">
        <h3 className="text-2xl font-black text-white px-2 mb-6 tracking-tighter">People You May Know</h3>
        <div className="grid grid-cols-1 gap-1">
          {suggestedUsers.map(u => (
            <div 
              key={u.id || u.uid}
              onClick={() => setSelectedUser(u)}
              className="flex items-center gap-4 p-4 hover:bg-x-hover rounded-2xl cursor-pointer transition-all group"
            >
              <img src={u.photo_url || u.photoURL} className="w-14 h-14 rounded-full shadow-lg" />
              <div className="flex-1">
                <p className="font-bold text-lg group-hover:text-x-blue transition-colors">{u.display_name || u.displayName}</p>
                <p className="text-x-gray text-sm truncate max-w-[200px]">{u.bio || 'New to Conector'}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnect(u.id || u.uid);
                }}
                className={`p-3 rounded-full transition-all ${isConnected(u.id || u.uid) ? 'bg-x-blue text-white' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                {isConnected(u.id || u.uid) ? <Check size={20} /> : <UserPlus size={20} />}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="h-32 bg-gradient-to-br from-x-blue to-purple-600 relative">
                <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md">
                  <X size={18} className="text-white" />
                </button>
              </div>
              <div className="px-8 pb-8 -mt-12 text-center">
                <img src={selectedUser.photo_url || selectedUser.photoURL} className="w-24 h-24 rounded-full border-4 border-zinc-900 mx-auto shadow-xl" />
                <h2 className="text-2xl font-black mt-4">{selectedUser.display_name || selectedUser.displayName}</h2>
                <p className="text-x-blue font-bold text-sm">@{selectedUser.email.split('@')[0]}</p>
                
                <div className="mt-8 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-x-gray">
                    <FileText size={18} className="text-x-blue" />
                    <p className="text-sm italic">{selectedUser.bio || 'No bio yet.'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-x-gray">
                    <Phone size={18} className="text-x-blue" />
                    <p className="text-sm font-mono tracking-wider">{selectedUser.phone_number || selectedUser.phoneNumber || 'Not listed'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  {!isConnected(selectedUser.id || selectedUser.uid) ? (
                    <button 
                      onClick={() => {
                        handleConnect(selectedUser.id || selectedUser.uid);
                        setSelectedUser(null);
                      }}
                      className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={20} />
                      Conect
                    </button>
                  ) : (
                    <div className="text-x-blue font-bold flex items-center justify-center gap-2">
                       <Check size={20} />
                       Connected
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
