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
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gr-paper">
        <BgPattern />
        <Loader2 className="h-10 w-10 text-gr-board animate-spin opacity-60 z-10" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-gr-paper">
      <BgPattern />
      <Glow color="var(--gr-board)" position="center" className="opacity-10 pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-8 rounded-sm border border-gr-line bg-white/80 p-8 sm:p-10 backdrop-blur-xl shadow-xl relative overflow-hidden">
        {/* Editorial Double Rule Top Accent */}
        <div className="absolute top-0 inset-x-0">
          <div className="h-[3px] bg-gr-ink w-full" />
          <div className="h-[1px] bg-gr-ink w-full mt-[2px]" />
        </div>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gr-line bg-gr-paper text-gr-ink mb-4 shadow-xs">
            <Store size={22} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gr-ink">
            Mulai Jualan
          </h2>
          <p className="mt-2.5 font-sans text-xs text-gr-ink-soft max-w-xs leading-relaxed">
            Upgrade akun Anda menjadi Farmer untuk mulai memasarkan hasil panen Anda secara langsung.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="rounded-sm bg-gr-up/10 p-4 text-xs font-mono text-gr-up border border-gr-up/30">
              Selamat! Akun Anda telah sukses diupgrade menjadi Farmer.
            </div>
            <p className="font-sans text-xs text-gr-ink-soft/70">
              Mengalihkan ke halaman jual produk...
            </p>
            <Button
              onClick={() => router.push('/jual')}
              className="w-full bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-widest py-6 rounded-sm shadow-md cursor-pointer"
            >
              Ke Halaman Jual
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-sm bg-gr-down/10 p-3.5 text-xs text-gr-down border border-gr-down/30 font-mono text-[11px]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-1.5">
                  Nomor WhatsApp Farmer
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0812..."
                  required
                  className="block w-full rounded-sm border border-gr-line bg-white/70 px-3.5 py-2.5 font-sans text-gr-ink placeholder-gr-ink-soft/40 focus:border-gr-board focus:outline-none focus:ring-1 focus:ring-gr-board text-sm transition-all shadow-xs"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-2 font-sans text-[10px] text-gr-ink-soft/70 leading-relaxed">
                  Masukkan nomor telepon Indonesia aktif (misal: 08xx atau +628xx). Kontak ini akan digunakan pembeli untuk menghubungi Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-widest py-6 rounded-sm shadow-md cursor-pointer transition-all"
              >
                {loading ? 'Memproses Upgrade...' : 'Upgrade Jadi Farmer'}
              </Button>

              <Link href="/beranda" className="flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-gr-ink-soft/60 hover:text-gr-ink transition-colors py-2">
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
