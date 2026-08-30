'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-fixed flex flex-col items-center justify-center p-4 font-montserrat text-black relative">
      
      <div className="text-center mb-10 space-y-4 flex flex-col items-center relative z-10">
        <img 
          src="/logo.png" 
          alt="Pantreasy Logo" 
          className="w-[120px] h-[120px] object-contain mix-blend-multiply" 
        />
        <div>
          <h1 className="text-6xl md:text-7xl font-mogena tracking-tight text-black drop-shadow-sm">
            Pantreasy
          </h1>
          <p className="text-lg text-black/70 font-medium mt-2">
            Your smart kitchen companion
          </p>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#6B705C] rounded-[32px] p-8 shadow-xl text-white border border-black/10 relative z-20">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-white/90 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none bg-white text-black shadow-sm placeholder:text-black/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-white/90 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none bg-white text-black shadow-sm placeholder:text-black/40"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-800 text-sm rounded-xl text-center font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-100 text-emerald-800 text-sm rounded-xl text-center font-medium">
              {message}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full px-6 py-3.5 font-bold rounded-2xl bg-black text-white hover:bg-black/80 text-lg cursor-pointer disabled:opacity-50 transition shadow-md active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute border-t border-white/20 w-full"></div>
              <span className="bg-[#6B705C] px-3 text-sm text-white/70 relative z-10 uppercase tracking-widest font-bold">or</span>
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-6 py-3.5 font-bold rounded-2xl border-2 border-white/20 bg-transparent text-white hover:bg-white/10 text-lg cursor-pointer disabled:opacity-50 transition active:scale-[0.98]"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}