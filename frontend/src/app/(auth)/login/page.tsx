'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <Glow color="var(--gr-green)" position="center" className="opacity-10" />
      
      <div className="z-10 w-full max-w-md space-y-8 rounded-xl border border-white/5 bg-gr-bg-elevated p-8 backdrop-blur-md">
        <div>
          <h2 className="text-center font-display text-4xl font-medium tracking-tight text-gr-text-primary">
            Masuk ke Grove
          </h2>
          <p className="mt-2 text-center font-sans text-sm text-gr-text-primary/60">
            Akses marketplace hasil panen transparan
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded bg-gr-price-unfair/10 p-3 text-sm text-gr-price-unfair border border-gr-price-unfair/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest py-6"
          >
            {loading ? 'Processing...' : 'Masuk'}
          </Button>
          
          <div className="text-center">
            <Link href="/register" className="font-sans text-sm text-gr-green hover:underline">
              Belum punya akun? Daftar sekarang
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
