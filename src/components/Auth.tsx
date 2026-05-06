import React, { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirect, setShowRedirect] = useState(false);

  const handleSignIn = async (useRedirect = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (useRedirect) {
        const { getAuth, GoogleAuthProvider, signInWithRedirect } = await import('firebase/auth');
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        console.log("Popup closed by user");
        // Don't show error for simple close, but maybe show the helper link
        setShowRedirect(true);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Domain not authorized. Please add this domain to your Firebase Console authorized domains list.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked by browser. Please enable popups or use the alternate method below.");
        setShowRedirect(true);
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Authentication failed: ${err.message || "Unknown error"}`);
        setShowRedirect(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,155,240,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="text-center p-8 border border-x-border rounded-[44px] max-w-sm w-full bg-zinc-900/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
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
              className="text-red-500 text-[11px] font-bold mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={() => handleSignIn(false)}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100 mb-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          )}
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>

        {showRedirect && !loading && (
          <button 
            onClick={() => handleSignIn(true)}
            className="text-[10px] text-x-gray font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Having trouble? Try alternate sign-in
          </button>
        )}
      </motion.div>
    </div>
  );
}
