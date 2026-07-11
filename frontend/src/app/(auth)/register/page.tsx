'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'pembeli',
    phone_whatsapp: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.register(formData);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <Glow color="var(--gr-orange)" position="center" className="opacity-10" />
      
      <div className="z-10 w-full max-w-md space-y-8 rounded-xl border border-white/5 bg-gr-bg-elevated p-8 backdrop-blur-md">
        <div>
          <h2 className="text-center font-display text-4xl font-medium tracking-tight text-gr-text-primary">
            Daftar Grove
          </h2>
          <p className="mt-2 text-center font-sans text-sm text-gr-text-primary/60">
            Bergabung dengan komunitas tani transparan
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded bg-gr-price-unfair/10 p-3 text-sm text-gr-price-unfair border border-gr-price-unfair/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Nama Lengkap
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone_whatsapp" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                WhatsApp
              </label>
              <input
                id="phone_whatsapp"
                name="phone_whatsapp"
                type="tel"
                placeholder="0812..."
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={formData.phone_whatsapp}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Peran
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs uppercase tracking-widest text-gr-text-primary focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="pembeli">PEMBELI</option>
                <option value="petani">PETANI</option>
                <option value="agen">AGEN</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block font-sans text-xs font-medium uppercase tracking-wider text-gr-text-primary/50">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gr-orange text-gr-bg hover:bg-gr-orange/90 font-sans font-bold uppercase tracking-widest py-6 mt-4"
          >
            {loading ? 'Processing...' : 'Daftar'}
          </Button>
          
          <div className="text-center">
            <Link href="/login" className="font-sans text-sm text-gr-orange hover:underline">
              Sudah punya akun? Masuk
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
