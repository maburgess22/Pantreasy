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
    <main className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-fixed flex flex-col items-center justify-center p-4 font-montserrat text-black">
      <div className="text-center mb-10 space-y-2">
        <img 
          src="/logo.png" 
          alt="Pantreasy Logo" 
          className="w-24 h-24 mx-auto mb-4 rounded-full object-cover mix-blend-multiply" 
        />
        <h1 className="text-6xl md:text-7xl font-mogena tracking-tight text-black drop-shadow-sm">
          Pantreasy
        </h1>
        <p className="text-lg text-black/70 font-medium">
          Your smart kitchen companion
        </p>
      </div>

      <div className="w-full max-w-md bg-[#6B705C] rounded-[32px] p-8 shadow-xl text-white">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        
        <form className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-white/90 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-white/30 bg-white text-black placeholder:text-black/40 transition shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-white/90 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-white/30 bg-white text-black placeholder:text-black/40 transition shadow-sm"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-xl text-center font-medium">{error}</div>}
          {message && <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm rounded-xl text-center font-medium">{message}</div>}

          <div className="pt-4 space-y-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full px-6 py-3.5 font-bold rounded-2xl transition shadow-md active:scale-[0.98] disabled:opacity-50 bg-black text-white hover:bg-black/80 text-lg"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute border-t border-white/20 w-full"></div>
              <span className="bg-[#6B705C] px-3 text-sm text-white/70 relative z-10 uppercase tracking-widest font-bold">or</span>
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-6 py-3.5 font-bold rounded-2xl transition border-2 border-white/20 active:scale-[0.98] disabled:opacity-50 bg-transparent text-white hover:bg-white/10 text-lg"
            >
              Create an Account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}