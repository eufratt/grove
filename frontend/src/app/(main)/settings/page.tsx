'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';
import { User, Store, ArrowLeft, Loader2, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        setPhone(userData.phone_whatsapp || '');
      } catch (err) {
        console.error('Failed to get user:', err);
        router.replace('/login');
      } finally {
        setFetching(false);
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
    setError('');
    setSuccess('');

    if (phone && !validatePhone(phone)) {
      setError('Format nomor telepon tidak valid. Gunakan format Indonesia (misal: 08xx atau +628xx)');
      return;
    }

    setLoading(true);

    try {
      const updatedUser = await authApi.updateProfile({ phone_whatsapp: phone || null });
      setUser(updatedUser);
      setSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            <User size={24} />
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-gr-text-primary">
            Pengaturan Profil
          </h2>
          <p className="mt-3 font-sans text-sm text-gr-text-primary/60 max-w-xs leading-relaxed">
            Perbarui data akun dan kontak WhatsApp Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded bg-gr-price-unfair/10 p-4 text-xs text-gr-price-unfair border border-gr-price-unfair/20">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded bg-gr-green/10 p-4 text-xs text-gr-green border border-gr-green/20 flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-gr-text-primary/40 mb-1">
                Nama Lengkap
              </span>
              <div className="block w-full rounded-md border border-white/5 bg-white/[0.02] px-3 py-3 font-sans text-gr-text-primary/60 sm:text-sm">
                {user?.full_name}
              </div>
            </div>

            <div>
              <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-gr-text-primary/40 mb-1">
                Email
              </span>
              <div className="block w-full rounded-md border border-white/5 bg-white/[0.02] px-3 py-3 font-sans text-gr-text-primary/60 sm:text-sm">
                {user?.email}
              </div>
            </div>

            <div>
              <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-gr-text-primary/40 mb-1">
                Peran Akun
              </span>
              <div className="inline-block px-3 py-1.5 rounded-full border border-white/10 bg-white/5 font-sans text-[10px] font-bold uppercase tracking-wider text-gr-text-primary/70">
                {user?.role === 'PETANI' ? 'Farmer / Petani' : 'Buyer / Pembeli'}
              </div>
            </div>

            <div>
              <label htmlFor="settings-phone" className="block font-sans text-xs font-semibold uppercase tracking-wider text-gr-text-primary/50 mb-2">
                Nomor WhatsApp
              </label>
              <input
                id="settings-phone"
                type="tel"
                placeholder="0812..."
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green sm:text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-2 font-sans text-[9px] text-gr-text-primary/40 leading-relaxed">
                Digunakan sebagai kontak pembeli/penjual untuk koordinasi transaksi belanja.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest py-6 shadow-lg shadow-gr-green/20 cursor-pointer"
            >
              {loading ? 'Menyimpan...' : (
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  <span>Simpan Perubahan</span>
                </div>
              )}
            </Button>

            {user?.role !== 'PETANI' && (
              <div className="mt-4 border-t border-white/5 pt-4 text-center">
                <p className="font-sans text-xs text-gr-text-primary/50 mb-3">
                  Ingin menjual hasil panen Anda sendiri?
                </p>
                <Link href="/settings/upgrade-to-farmer" className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-green hover:underline">
                  <Store size={14} />
                  Upgrade ke Farmer
                </Link>
              </div>
            )}

            <Link href="/beranda" className="flex items-center justify-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-text-primary transition-colors py-2 mt-2">
              <ArrowLeft size={12} />
              Kembali ke Beranda
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
