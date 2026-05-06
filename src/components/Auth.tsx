import React, { useState } from 'react';
import { LogIn, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { signInWithGoogleSupabase, signInWithEmailSupabase, signUpWithEmailSupabase } from '../lib/auth-supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'google' | 'email-login' | 'email-signup'>('google');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogleSupabase();
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(`Authentication failed: ${err.message || "Unknown error"}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'email-signup') {
        if (!fullName) throw new Error("Full name is required");
        await signUpWithEmailSupabase(email, password, fullName);
        setError("Success! Please check your email for confirmation.");
      } else {
        await signInWithEmailSupabase(email, password);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,155,240,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="text-center p-8 border border-white/5 rounded-[44px] max-w-sm w-full bg-zinc-900/40 backdrop-blur-2xl shadow-2xl relative z-10"
      >
        <div className="mb-10">
          <motion.img 
            src="https://i.ibb.co.com/d0LcTMfR/Dmitri-dmiiiitri-on-X.jpg" 
            alt="Conector" 
            animate={loading ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={loading ? { repeat: Infinity, duration: 2 } : {}}
            className="w-16 h-16 mx-auto rounded-2xl border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=C&background=fff&color=000&bold=true&size=128';
            }}
          />
        </div>
        <h1 className="text-3xl font-black mb-1 text-white tracking-tighter">CONECTOR</h1>
        <p className="text-x-gray font-bold mb-8 uppercase tracking-[0.3em] text-[10px]">Connect with purpose</p>
        
        <AnimatePresence mode="wait">
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

        {mode === 'google' ? (
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />}
              Continue with Google
            </button>
            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[10px] text-x-gray font-black uppercase">OR</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
            <button
              onClick={() => setMode('email-login')}
              className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Continue with Email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
            {mode === 'email-signup' && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray w-5 h-5" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-x-blue transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray w-5 h-5" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-x-blue transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-x-blue transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-x-blue text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-x-blue/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : mode === 'email-login' ? 'Sign In' : 'Create Account'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                className="text-xs text-x-gray font-bold hover:text-white transition-colors"
              >
                {mode === 'email-login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMode('google')}
              className="w-full text-xs text-x-gray font-black uppercase tracking-widest mt-4 hover:text-white"
            >
              ← Back to Google
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
