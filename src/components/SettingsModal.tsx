import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, LogOut, ChevronRight, Shield, Bell, UserX, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUnblock: () => void;
}

export default function SettingsModal({ user, isOpen, onClose, onUnblock }: SettingsModalProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = user.id || user.uid;

  React.useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers();
    }
  }, [isOpen]);

  const fetchBlockedUsers = async () => {
    const { data: userData } = await supabase
      .from('users')
      .select('blocked_users')
      .eq('id', currentUserId)
      .single();
    
    if (userData) {
      const blockedIds = userData.blocked_users || [];
      if (blockedIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users')
          .select('*')
          .in('id', blockedIds);
        setBlockedUsers(profiles || []);
      } else {
        setBlockedUsers([]);
      }
    }
  };

  const handleUnblock = async (targetUid: string) => {
    try {
      const newBlocked = blockedUsers.filter(u => (u.id || u.uid) !== targetUid).map(u => u.id || u.uid);
      await supabase
        .from('users')
        .update({
          blocked_users: newBlocked
        })
        .eq('id', currentUserId);
      setBlockedUsers(prev => prev.filter(u => (u.id || u.uid) !== targetUid));
      onUnblock();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-lg bg-zinc-900 md:rounded-[40px] rounded-t-[40px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <header className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black">Settings</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-xs font-black text-x-gray uppercase tracking-widest mb-4">Security & Access</h3>
                <div className="space-y-2">
                  <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-x-blue/10 rounded-xl text-x-blue">
                        <UserX size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Blocked Users</p>
                        <p className="text-xs text-x-gray">Manage restricted connections</p>
                      </div>
                    </div>
                  </div>
                  
                  {blockedUsers.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {blockedUsers.map(u => (
                        <div key={u.id || u.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl ml-4">
                          <div className="flex items-center gap-3">
                            <img src={u.photo_url || u.photoURL} className="w-8 h-8 rounded-full" />
                            <span className="font-bold text-sm">{u.display_name || u.displayName}</span>
                          </div>
                          <button 
                            onClick={() => handleUnblock(u.id || u.uid)}
                            className="text-xs font-black text-x-blue hover:underline"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-x-gray ml-4 py-2">No blocked users.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-x-gray uppercase tracking-widest mb-4">Account</h3>
                <button 
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                      <LogOut size={20} />
                    </div>
                    <p className="font-bold text-red-500">Logout</p>
                  </div>
                  <ChevronRight size={18} className="text-red-500/40 group-hover:translate-x-1 transition-transform" />
                </button>
              </section>
            </div>
          </motion.div>

          {/* Confirm Sign Out */}
          <AnimatePresence>
            {showSignOutConfirm && (
              <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm text-center shadow-2xl"
                >
                  <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Logout?</h3>
                  <p className="text-x-gray mb-8">Are you sure you want to log out of Conector?</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowSignOutConfirm(false)}
                      className="flex-1 font-black py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                      Yes, Logout
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
