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
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#F7F5DC] flex flex-col items-center justify-center p-4 font-montserrat text-black">
      
      {/* HEADER */}
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-6xl md:text-7xl font-mogena tracking-tight text-black drop-shadow-sm">
          Pantreasy
        </h1>
        <p className="text-lg text-black/70 font-medium">
          Your smart kitchen companion
        </p>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-[#6B705C]/20 border border-black/10 rounded-[32px] p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-black">Welcome Back</h2>
        
        <form className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/80 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-black/20 bg-[#F7F5DC] border border-black/20 text-black placeholder:text-black/40 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/80 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-black/20 bg-[#F7F5DC] border border-black/20 text-black placeholder:text-black/40 transition"
              required
            />
          </div>

          {/* ALERTS */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-xl text-center font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm rounded-xl text-center font-medium">
              {message}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full px-6 py-3.5 font-medium rounded-2xl transition shadow-md active:scale-[0.98] disabled:opacity-50 bg-black text-[#F7F5DC] hover:bg-black/80 text-lg"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute border-t border-black/10 w-full"></div>
              <span className="bg-[#6B705C]/0 px-3 text-sm text-black/50 relative z-10 backdrop-blur-3xl rounded-full">or</span>
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-6 py-3.5 font-medium rounded-2xl transition border border-black/20 active:scale-[0.98] disabled:opacity-50 bg-[#F7F5DC] text-black hover:bg-black/5 text-lg"
            >
              Create an Account
            </button>
          </div>
        </form>
      </div>
      
    </main>
  );
}