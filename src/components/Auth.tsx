import React, { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // Silently handle common user cancellations
        console.log("Popup closed by user");
      } else {
        setError("Sign in failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 border border-x-border rounded-[40px] max-w-sm w-full bg-zinc-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        <div className="mb-10">
          <motion.img 
            src="https://i.ibb.co.com/d0LcTMfR/Dmitri-dmiiiitri-on-X.jpg" 
            alt="Conector" 
            animate={loading ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
            transition={loading ? { repeat: Infinity, duration: 2 } : {}}
            className="w-20 h-20 mx-auto rounded-3xl shadow-xl border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=C&background=fff&color=000&bold=true&size=128';
            }}
          />
        </div>
        <h1 className="text-4xl font-black mb-2 text-white tracking-tighter">CONECTOR</h1>
        <p className="text-x-gray font-bold mb-10 uppercase tracking-[0.3em] text-[10px]">Connect with purpose</p>
        
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-xs font-bold mb-4 bg-red-500/10 p-3 rounded-xl"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          )}
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>
      </motion.div>
    </div>
  );
}
