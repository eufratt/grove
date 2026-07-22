'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ratingsApi } from '@/lib/api/ratings';
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

  const [sellerRatings, setSellerRatings] = useState<any>(null);
  const [buyerRatings, setBuyerRatings] = useState<any>(null);
  const [showSellerList, setShowSellerList] = useState(false);
  const [showBuyerList, setShowBuyerList] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        setPhone(userData.phone_whatsapp || '');
        
        try {
          const sellerData = await ratingsApi.getUserRatingsAsSeller(userData.id);
          setSellerRatings(sellerData);
          
          const buyerData = await ratingsApi.getUserRatingsAsBuyer(userData.id);
          setBuyerRatings(buyerData);
        } catch (rErr) {
          console.error('Failed to fetch ratings:', rErr);
        }
      } catch (err: any) {
        if (err.status !== 401) {
          console.error('Failed to get user:', err);
        }
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
            <User size={22} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gr-ink">
            Pengaturan Profil
          </h2>
          <p className="mt-2.5 font-sans text-xs text-gr-ink-soft max-w-xs leading-relaxed">
            Perbarui data akun dan kontak WhatsApp Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-sm bg-gr-down/10 p-3.5 text-xs text-gr-down border border-gr-down/30 font-mono text-[11px]">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-sm bg-gr-up/10 p-3.5 text-xs text-gr-up border border-gr-up/30 font-mono text-[11px] flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-1.5">
                Nama Lengkap
              </span>
              <div className="block w-full rounded-sm border border-gr-line bg-white/50 px-3.5 py-2.5 font-sans text-gr-ink text-sm font-medium shadow-xs">
                {user?.full_name}
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-1.5">
                Email
              </span>
              <div className="block w-full rounded-sm border border-gr-line bg-white/50 px-3.5 py-2.5 font-sans text-gr-ink text-sm font-medium shadow-xs">
                {user?.email}
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-1.5">
                Peran Akun
              </span>
              <div className="inline-block px-3 py-1 rounded-sm border border-gr-line bg-gr-paper font-mono text-[11px] font-bold uppercase tracking-wider text-gr-board shadow-xs">
                {user?.role === 'PETANI' ? 'Farmer / Petani' : 'Buyer / Pembeli'}
              </div>
            </div>

            {/* Reputation Ratings Section */}
            <div className="border-t border-gr-line pt-4 mt-5 space-y-4">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-2">
                Skor Reputasi
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Seller Rating Box */}
                <div className="rounded-sm border border-gr-line bg-white/40 p-3 shadow-xs">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-gr-ink-soft/80">
                    Sebagai Penjual
                  </span>
                  {sellerRatings && sellerRatings.count > 0 ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm font-bold text-gr-up">⭐ {sellerRatings.average}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSellerList(!showSellerList)}
                        className="mt-1 font-mono text-[10px] text-gr-up hover:underline cursor-pointer focus:outline-none"
                      >
                        ({sellerRatings.count} transaksi)
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-[10px] text-gr-ink-soft/50 italic">
                      Belum ada rating
                    </p>
                  )}
                </div>

                {/* Buyer Rating Box */}
                <div className="rounded-sm border border-gr-line bg-white/40 p-3 shadow-xs">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-gr-ink-soft/80">
                    Sebagai Pembeli
                  </span>
                  {buyerRatings && buyerRatings.count > 0 ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm font-bold text-gr-up">⭐ {buyerRatings.average}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBuyerList(!showBuyerList)}
                        className="mt-1 font-mono text-[10px] text-gr-up hover:underline cursor-pointer focus:outline-none"
                      >
                        ({buyerRatings.count} permintaan)
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-[10px] text-gr-ink-soft/50 italic">
                      Belum ada rating
                    </p>
                  )}
                </div>
              </div>

              {/* Collapsible Seller Reviews List */}
              {showSellerList && sellerRatings && sellerRatings.ratings.length > 0 && (
                <div className="mt-3 p-3 rounded-sm border border-gr-line bg-gr-paper/90 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar shadow-xs">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gr-ink-soft border-b border-gr-line pb-1">
                    Ulasan Sebagai Penjual
                  </p>
                  {sellerRatings.ratings.map((r: any) => (
                    <div key={r.id} className="text-xs font-sans border-b border-gr-line last:border-0 pb-1.5 last:pb-0 pt-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-gr-ink font-semibold">{r.rater_name || 'Pembeli'}</span>
                        <span className="text-gr-up font-mono font-bold">⭐ {r.score}</span>
                      </div>
                      {r.comment && <p className="text-gr-ink-soft italic mt-0.5">"{r.comment}"</p>}
                      <span className="text-[8px] text-gr-ink-soft/60 block mt-0.5 font-mono">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsible Buyer Reviews List */}
              {showBuyerList && buyerRatings && buyerRatings.ratings.length > 0 && (
                <div className="mt-3 p-3 rounded-sm border border-gr-line bg-gr-paper/90 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar shadow-xs">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gr-ink-soft border-b border-gr-line pb-1">
                    Ulasan Sebagai Pembeli
                  </p>
                  {buyerRatings.ratings.map((r: any) => (
                    <div key={r.id} className="text-xs font-sans border-b border-gr-line last:border-0 pb-1.5 last:pb-0 pt-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-gr-ink font-semibold">{r.rater_name || 'Petani'}</span>
                        <span className="text-gr-up font-mono font-bold">⭐ {r.score}</span>
                      </div>
                      {r.comment && <p className="text-gr-ink-soft italic mt-0.5">"{r.comment}"</p>}
                      <span className="text-[8px] text-gr-ink-soft/60 block mt-0.5 font-mono">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="settings-phone" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/70 mb-1.5">
                Nomor WhatsApp
              </label>
              <input
                id="settings-phone"
                type="tel"
                placeholder="0812..."
                className="block w-full rounded-sm border border-gr-line bg-white/70 px-3.5 py-2.5 font-sans text-gr-ink placeholder-gr-ink-soft/40 focus:border-gr-board focus:outline-none focus:ring-1 focus:ring-gr-board text-sm transition-all shadow-xs"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-2 font-sans text-[10px] text-gr-ink-soft/70 leading-relaxed">
                Digunakan sebagai kontak pembeli/penjual untuk koordinasi transaksi belanja.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-widest py-6 rounded-sm shadow-md cursor-pointer transition-all"
            >
              {loading ? 'Menyimpan...' : (
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  <span>Simpan Perubahan</span>
                </div>
              )}
            </Button>

            {user?.role !== 'PETANI' && (
              <div className="mt-3 border-t border-gr-line/60 pt-4 text-center">
                <p className="font-sans text-xs text-gr-ink-soft/80 mb-2">
                  Ingin menjual hasil panen Anda sendiri?
                </p>
                <Link href="/settings/upgrade-to-farmer" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-gr-board hover:underline">
                  <Store size={14} />
                  Upgrade ke Farmer
                </Link>
              </div>
            )}

            <Link href="/beranda" className="flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-gr-ink-soft/60 hover:text-gr-ink transition-colors py-2 mt-1">
              <ArrowLeft size={12} />
              Kembali ke Beranda
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

