'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';
import { UserCheck } from 'lucide-react';

export default function LengkapiProfilPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentPosition = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const validatePhone = (num: string) => {
    const cleaned = num.replace(/[\s\-()]/g, '');
    return /^(\+628|628|08)[0-9]{7,11}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Nomor WhatsApp wajib diisi');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Format nomor telepon tidak valid. Gunakan format Indonesia (misal: 08xx atau +628xx)');
      return;
    }

    setLoading(true);
    setError('');

    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const position = await getCurrentPosition();
      if (position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
    } catch (err) {
      console.warn('Failed to get geolocation:', err);
    }

    try {
      await authApi.completeProfile(phone, lat, lng);
      router.push('/beranda');
    } catch (err: any) {
      setError(err.message || 'Gagal melengkapi profil');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <Glow color="var(--gr-orange)" position="center" className="opacity-15" />

      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-gr-bg-elevated p-10 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gr-orange/20 bg-gr-orange/5 text-gr-orange mb-6 shadow-[0_0_15px_rgba(255,155,113,0.1)]">
            <UserCheck size={24} />
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-gr-text-primary">
            Lengkapi Profil
          </h2>
          <p className="mt-3 font-sans text-sm text-gr-text-primary/60 max-w-xs leading-relaxed">
            Lengkapi kontak WhatsApp Anda untuk bertransaksi di Grove.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded bg-gr-price-unfair/10 p-4 text-xs text-gr-price-unfair border border-gr-price-unfair/20 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block font-sans text-xs font-semibold uppercase tracking-wider text-gr-text-primary/50 mb-2">
                Nomor WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="0812..."
                required
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-orange focus:outline-none focus:ring-1 focus:ring-gr-orange sm:text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gr-orange text-gr-bg hover:bg-gr-orange/90 font-sans font-bold uppercase tracking-widest py-6 shadow-lg shadow-gr-orange/20 cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Masuk'}
          </Button>
        </form>
      </div>
    </main>
  );
}
