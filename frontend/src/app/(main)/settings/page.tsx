'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ratingsApi } from '@/lib/api/ratings';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { User, Store, ArrowLeft, Loader2, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  
  // Editable Profile States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reputation Stats States
  const [sellerRatings, setSellerRatings] = useState<any>(null);
  const [buyerRatings, setBuyerRatings] = useState<any>(null);
  const [showSellerList, setShowSellerList] = useState(false);
  const [showBuyerList, setShowBuyerList] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        setFullName(userData.full_name || '');
        setPhone(userData.phone_whatsapp || '');
        setAvatarUrl(userData.avatar_url || '');
        setBio(userData.bio || '');
        
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

    if (!fullName.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }

    if (phone && !validatePhone(phone)) {
      setError('Format nomor telepon tidak valid. Gunakan format Indonesia (misal: 08xx atau +628xx)');
      return;
    }

    setLoading(true);

    try {
      const updatedUser = await authApi.updateProfile({ 
        full_name: fullName.trim(),
        phone_whatsapp: phone || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null
      });
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
    <main className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 bg-gr-paper">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 pointer-events-none" />

      <div className="z-10 w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gr-line pb-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-gr-ink">
              Pengaturan Akun
            </h1>
            <p className="mt-1.5 font-sans text-xs text-gr-ink-soft">
              Kelola data profil, detail kontak, dan tinjau reputasi transaksi Anda.
            </p>
          </div>
          <Link
            href="/beranda"
            className="inline-flex items-center gap-1.5 border border-gr-line bg-white hover:bg-gr-paper text-gr-ink font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-sm transition-all shadow-2xs hover:border-gr-ink-soft/45 cursor-pointer"
          >
            <ArrowLeft size={12} /> Kembali ke Beranda
          </Link>
        </div>

        {/* Settings Form & Stats Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Personal Profile Customization (7/12 width) */}
          <div className="lg:col-span-7 bg-[#FAF9F5] border border-gr-line p-6 sm:p-8 rounded-sm shadow-xs space-y-6 relative overflow-hidden">
            {/* Double top rule */}
            <div className="absolute top-0 inset-x-0">
              <div className="h-[2.5px] bg-gr-ink w-full" />
              <div className="h-[0.8px] bg-gr-ink w-full mt-[1.5px]" />
            </div>

            <div className="border-b border-gr-line/40 pb-2.5">
              <h2 className="font-display text-base font-bold text-gr-ink flex items-center gap-2">
                <User size={16} className="text-gr-board" /> Personalisasi Profil
              </h2>
            </div>

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
              {/* Full Name */}
              <div>
                <label htmlFor="settings-name" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  className="block w-full rounded-sm border border-gr-line bg-white/70 px-3.5 py-2.5 font-sans text-gr-ink placeholder-gr-ink-soft/40 focus:border-gr-board focus:outline-none focus:ring-1 focus:ring-gr-board text-sm transition-all shadow-xs"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="settings-avatar" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft mb-1.5">
                  URL Foto Profil
                </label>
                <div className="flex gap-3 items-center">
                  {/* Live Avatar Preview */}
                  <div className="relative h-11 w-11 rounded-full bg-white p-0.5 border border-gr-line shadow-2xs shrink-0">
                    <div className="h-full w-full rounded-full bg-gr-paper/40 overflow-hidden flex items-center justify-center text-gr-text-primary font-display text-sm font-bold uppercase border border-gr-line/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-gr-ink opacity-40">
                          {fullName ? fullName.charAt(0) : '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    id="settings-avatar"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    className="block w-full rounded-sm border border-gr-line bg-white/70 px-3.5 py-2.5 font-sans text-gr-ink placeholder-gr-ink-soft/40 focus:border-gr-board focus:outline-none focus:ring-1 focus:ring-gr-board text-sm transition-all shadow-xs"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
                <p className="mt-1.5 font-sans text-[10px] text-gr-ink-soft/60">
                  Gunakan URL gambar publik untuk mengubah foto profil Anda.
                </p>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label htmlFor="settings-phone" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft mb-1.5">
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
                <p className="mt-1.5 font-sans text-[10px] text-gr-ink-soft/60">
                  Kontak WhatsApp utama untuk bertransaksi dan negosiasi pasokan pangan.
                </p>
              </div>

              {/* Bio / Deskripsi (Farmers Only) */}
              {user?.role === 'PETANI' && (
                <div>
                  <label htmlFor="settings-bio" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft mb-1.5">
                    Deskripsi / Bio Petani
                  </label>
                  <textarea
                    id="settings-bio"
                    rows={4}
                    maxLength={1000}
                    placeholder="Ceritakan tentang ladang, jenis tanaman, dan dedikasi pertanian Anda..."
                    className="block w-full rounded-sm border border-gr-line bg-white/70 focus:outline-none focus:ring-1 focus:ring-gr-board/20 p-2.5 font-sans text-xs text-gr-text-primary transition-all shadow-xs"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-1 font-mono text-[8px] text-gr-ink-soft/50">
                    <span>Akan ditampilkan di profil petani publik Anda</span>
                    <span>{bio.length}/1000</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gr-board text-gr-chalk hover:opacity-90 font-mono text-xs font-bold uppercase tracking-widest py-5 rounded-sm shadow-2xs cursor-pointer transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save size={14} />
                    <span>Simpan Perubahan</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* COLUMN 2: Account Details & Reputation (5/12 width) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Account Details Card */}
            <div className="bg-[#FAF9F5] border border-gr-line p-5 rounded-sm shadow-xs space-y-4">
              <h3 className="font-display text-sm font-bold text-gr-ink border-b border-gr-line/45 pb-2">
                Informasi Akun
              </h3>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-gr-ink-soft/60 mb-1">
                    Alamat Email
                  </span>
                  <div className="bg-white/40 border border-gr-line/60 rounded-sm px-3 py-2 text-gr-ink font-semibold">
                    {user?.email}
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-gr-ink-soft/60 mb-1">
                    Peran / Role Akun
                  </span>
                  <div className="inline-block px-2.5 py-1 rounded-sm border border-gr-line bg-gr-paper font-mono text-[10px] font-bold uppercase tracking-wider text-gr-board">
                    {user?.role === 'PETANI' ? 'Farmer / Mitra Petani' : 'Buyer / Pembeli Umum'}
                  </div>
                </div>

                {user?.role !== 'PETANI' && (
                  <div className="border-t border-gr-line/30 pt-3 mt-3">
                    <p className="text-[11px] text-gr-ink-soft mb-2 leading-relaxed">
                      Mulai menjual komoditas segar langsung dari ladang Anda sendiri?
                    </p>
                    <Link 
                      href="/settings/upgrade-to-farmer" 
                      className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-gr-board hover:underline"
                    >
                      <Store size={12} />
                      Upgrade ke Farmer
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Reputation & Reviews Card */}
            <div className="bg-[#FAF9F5] border border-gr-line p-5 rounded-sm shadow-xs space-y-4">
              <h3 className="font-display text-sm font-bold text-gr-ink border-b border-gr-line/45 pb-2">
                Skor Reputasi
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
                {/* Seller Stats */}
                <div className="rounded-sm border border-gr-line bg-white/40 p-3 shadow-2xs">
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-gr-ink-soft">
                    Sebagai Penjual
                  </span>
                  {sellerRatings && sellerRatings.count > 0 ? (
                    <div className="mt-1">
                      <span className="font-mono text-sm font-bold text-gr-ink">⭐ {sellerRatings.average.toFixed(1)}</span>
                      <button
                        type="button"
                        onClick={() => setShowSellerList(!showSellerList)}
                        className="block mt-1 font-mono text-[9px] text-gr-board hover:underline cursor-pointer focus:outline-none"
                      >
                        ({sellerRatings.count} Ulasan)
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-[10px] text-gr-ink-soft/40 italic">
                      Belum ada rating
                    </p>
                  )}
                </div>

                {/* Buyer Stats */}
                <div className="rounded-sm border border-gr-line bg-white/40 p-3 shadow-2xs">
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-gr-ink-soft">
                    Sebagai Pembeli
                  </span>
                  {buyerRatings && buyerRatings.count > 0 ? (
                    <div className="mt-1">
                      <span className="font-mono text-sm font-bold text-gr-ink">⭐ {buyerRatings.average.toFixed(1)}</span>
                      <button
                        type="button"
                        onClick={() => setShowBuyerList(!showBuyerList)}
                        className="block mt-1 font-mono text-[9px] text-gr-board hover:underline cursor-pointer focus:outline-none"
                      >
                        ({buyerRatings.count} Penilaian)
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-[10px] text-gr-ink-soft/40 italic">
                      Belum ada rating
                    </p>
                  )}
                </div>
              </div>

              {/* Collapsible Seller Reviews */}
              {showSellerList && sellerRatings && sellerRatings.ratings.length > 0 && (
                <div className="p-3.5 rounded-sm border border-gr-line bg-white/60 space-y-2.5 max-h-[180px] overflow-y-auto custom-scrollbar shadow-2xs animate-in fade-in duration-150">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-gr-ink-soft border-b border-gr-line/45 pb-1">
                    Ulasan Sebagai Penjual
                  </p>
                  {sellerRatings.ratings.map((r: any) => (
                    <div key={r.id} className="text-xs font-sans border-b border-gr-line/30 last:border-0 pb-1.5 last:pb-0 pt-0.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gr-ink font-bold text-[11px]">{r.rater_name || 'Pembeli'}</span>
                        <span className="text-gr-ink font-mono font-semibold text-[10px]">★ {r.score}</span>
                      </div>
                      {r.comment && <p className="text-gr-ink-soft/90 italic text-[11px] mt-0.5">"{r.comment}"</p>}
                      <span className="text-[8px] text-gr-ink-soft/50 block mt-0.5 font-mono">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsible Buyer Reviews */}
              {showBuyerList && buyerRatings && buyerRatings.ratings.length > 0 && (
                <div className="p-3.5 rounded-sm border border-gr-line bg-white/60 space-y-2.5 max-h-[180px] overflow-y-auto custom-scrollbar shadow-2xs animate-in fade-in duration-150">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-gr-ink-soft border-b border-gr-line/45 pb-1">
                    Ulasan Sebagai Pembeli
                  </p>
                  {buyerRatings.ratings.map((r: any) => (
                    <div key={r.id} className="text-xs font-sans border-b border-gr-line/30 last:border-0 pb-1.5 last:pb-0 pt-0.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gr-ink font-bold text-[11px]">{r.rater_name || 'Petani'}</span>
                        <span className="text-gr-ink font-mono font-semibold text-[10px]">★ {r.score}</span>
                      </div>
                      {r.comment && <p className="text-gr-ink-soft/90 italic text-[11px] mt-0.5">"{r.comment}"</p>}
                      <span className="text-[8px] text-gr-ink-soft/50 block mt-0.5 font-mono">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}
