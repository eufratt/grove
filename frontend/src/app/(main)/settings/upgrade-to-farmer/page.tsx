'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';
import { Store, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeToFarmerPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        if (userData.role === 'PETANI') {
          setSuccess(true);
        }
      } catch (err: any) {
        if (err.status !== 401) {
          console.error('Failed to get user:', err);
        }
        router.replace('/login');
      } finally {
        setCheckingUser(false);
      }
    };
    fetchUser();
  }, [router]);

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

    try {
      await authApi.upgradeToFarmer(phone);
      setSuccess(true);
      setTimeout(() => {
        router.push('/jual');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan upgrade role');
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gr-bg">
        <BgPattern />
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50 z-10" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-gr-bg">
      <BgPattern />
      <Glow color="var(--gr-green)" position="center" className="opacity-15" />

      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-gr-bg-elevated p-10 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gr-green/20 bg-gr-green/5 text-gr-green mb-6 shadow-[0_0_15px_rgba(92,255,158,0.1)]">
            <Store size={24} />
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-gr-text-primary">
            Mulai Jualan
          </h2>
          <p className="mt-3 font-sans text-sm text-gr-text-primary/60 max-w-xs leading-relaxed">
            Upgrade akun Anda menjadi Farmer untuk mulai memasarkan hasil panen Anda secara langsung.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="rounded bg-gr-green/10 p-4 text-sm text-gr-green border border-gr-green/20">
              Selamat! Akun Anda telah sukses diupgrade menjadi Farmer.
            </div>
            <p className="font-sans text-xs text-gr-text-primary/40">
              Mengalihkan ke halaman jual produk...
            </p>
            <Button
              onClick={() => router.push('/jual')}
              className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest py-6 shadow-lg shadow-gr-green/20"
            >
              Ke Halaman Jual
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded bg-gr-price-unfair/10 p-4 text-xs text-gr-price-unfair border border-gr-price-unfair/20">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block font-sans text-xs font-semibold uppercase tracking-wider text-gr-text-primary/50 mb-2">
                  Nomor WhatsApp Farmer
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0812..."
                  required
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green sm:text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-2 font-sans text-[10px] text-gr-text-primary/40 leading-relaxed">
                  Masukkan nomor telepon Indonesia aktif (misal: 08xx atau +628xx). Kontak ini akan digunakan pembeli untuk menghubungi Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest py-6 shadow-lg shadow-gr-green/20 cursor-pointer"
              >
                {loading ? 'Memproses Upgrade...' : 'Upgrade Jadi Farmer'}
              </Button>

              <Link href="/beranda" className="flex items-center justify-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-text-primary transition-colors py-2">
                <ArrowLeft size={12} />
                Kembali ke Beranda
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
