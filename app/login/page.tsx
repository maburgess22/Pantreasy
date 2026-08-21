'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setErrorMsg(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Pantreasy</h1>
          <p className="text-sm text-zinc-400 mt-1">Sign in or create an account to manage your pantry</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}