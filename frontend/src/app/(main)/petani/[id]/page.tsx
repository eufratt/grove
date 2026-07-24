'use client';

import React, { useState, useEffect, use } from 'react';
import { authApi } from '@/lib/api/auth';
import { productsApi } from '@/lib/api/products';
import { ratingsApi } from '@/lib/api/ratings';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { SellerRatingBadge } from '@/components/ratings/seller-rating-badge';
import { ProductCard } from '@/components/products/product-card';
import { provinceCentroids } from '@/lib/data/province-centroids';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Tag,
  Info,
  Calendar,
  Star,
  Edit3,
  Check,
  Palette,
  Mail,
  User,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const THEME_PRESETS = [
  { name: 'Forest Green', value: '#1b4332', glow: '#2d6a4f' },
  { name: 'Harvest Gold', value: '#d97706', glow: '#f59e0b' },
  { name: 'Sunset Orange', value: '#ea580c', glow: '#f97316' },
  { name: 'Ocean Blue', value: '#0284c7', glow: '#38bdf8' },
  { name: 'Earth Brown', value: '#78350f', glow: '#b45309' },
  { name: 'Royal Purple', value: '#7c3aed', glow: '#a78bfa' },
];

export default function FarmerProfilePage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [farmer, setFarmer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingsAvg, setRatingsAvg] = useState<number>(0);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('#1b4332');
  const [savingEdit, setSavingEdit] = useState(false);

  const getClosestProvince = (latitude: number, longitude: number) => {
    let closestProv = 'Di Yogyakarta';
    let minDist = Infinity;
    Object.entries(provinceCentroids).forEach(([provName, coords]) => {
      const dist = Math.sqrt((coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestProv = provName;
      }
    });
    return closestProv;
  };

  const getWhatsAppUrl = (phone: string, msg: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
  };

  const fetchFarmerData = async () => {
    try {
      const [farmerData, productsData, ratingsData, meData] = await Promise.all([
        authApi.getUserById(id),
        productsApi.getProducts(0, 100, id),
        ratingsApi.getUserRatingsAsSeller(id).catch(() => null),
        authApi.getMe().catch(() => null)
      ]);

      if (farmerData.role !== 'PETANI') {
        throw new Error('Pengguna ini bukan merupakan petani mitra Grove.');
      }

      setFarmer(farmerData);
      setProducts(productsData);
      setCurrentUser(meData);
      setEditBio(farmerData.bio || '');
      setSelectedTheme(farmerData.theme_color || '#1b4332');

      if (ratingsData) {
        setRatings(ratingsData.ratings || []);
        setRatingsAvg(ratingsData.average || 0);
        setRatingsCount(ratingsData.count || 0);
      }
    } catch (err: any) {
      console.error('Failed to load farmer profile:', err);
      setError(err.message || 'Gagal memuat profil petani.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerData();
  }, [id]);

  const handleSaveChanges = async () => {
    setSavingEdit(true);
    try {
      const updatedUser = await authApi.updateProfile({
        bio: editBio,
        theme_color: selectedTheme
      });
      setFarmer((prev: any) => ({
        ...prev,
        bio: updatedUser.bio,
        theme_color: updatedUser.theme_color
      }));
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      alert(err.message || 'Gagal memperbarui profil');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <BgPattern />
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <main className="relative min-h-[calc(100vh-80px)] bg-gr-bg py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <BgPattern />
        <div className="relative z-10 max-w-md w-full bg-white/80 border border-gr-line p-8 rounded-sm text-center shadow-xl">
          <h2 className="font-display text-2xl font-semibold text-gr-text-primary mb-3">Profil Tidak Ditemukan</h2>
          <p className="font-sans text-sm text-gr-text-primary/60 mb-6">{error || 'Data profil petani tidak dapat ditampilkan.'}</p>
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 bg-gr-green text-gr-bg hover:bg-gr-green/95 font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm shadow-md transition-all"
          >
            <ArrowLeft size={12} /> Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = currentUser && currentUser.id === farmer.id;
  const locationLabel = farmer.latitude && farmer.longitude
    ? getClosestProvince(farmer.latitude, farmer.longitude)
    : 'Nasional';

  // Selected Theme styling values
  const themeHex = farmer.theme_color || '#1b4332';
  const themePreset = THEME_PRESETS.find(p => p.value === themeHex) || THEME_PRESETS[0];

  const defaultBio = 'Petani mitra terverifikasi Grove yang berdedikasi menghasilkan produk pertanian segar berkualitas premium secara berkelanjutan dari ladang lokal langsung ke meja makan Anda. Berkomitmen menjaga kelestarian alam dan transparansi harga pasar.';
  const farmerBio = farmer.bio || defaultBio;

  const waMessage = `Halo Pak/Ibu ${farmer.full_name}, saya melihat profil Anda di Grove dan berminat untuk mendiskusikan hasil panen Anda.`;
  const waUrl = farmer.phone_whatsapp ? getWhatsAppUrl(farmer.phone_whatsapp, waMessage) : null;

  return (
    <main className="relative min-h-screen bg-gr-bg pt-6 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <BgPattern />
      <FilmGrain />
      <Glow color={themePreset.glow} position="top" className="opacity-12 pointer-events-none scale-105 duration-500" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back Link & Edit mode switch */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
          >
            ← Kembali ke Beranda
          </Link>

          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white px-3 py-1.5 rounded-full hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-sm"
              style={{ backgroundColor: themeHex }}
            >
              <Edit3 size={11} /> {isEditing ? 'Batal Edit' : 'Edit Halaman'}
            </button>
          )}
        </div>

        {/* Dynamic & Creative Farmer Header Info Card */}
        <div className="bg-[#FAF9F5] border-2 p-6 sm:p-8 rounded-sm shadow-xl mb-8 flex flex-col md:flex-row gap-8 justify-between relative overflow-hidden transition-all duration-300"
          style={{ borderColor: `${themeHex}20` }}>
          
          {/* Subtle themed side bar stripe */}
          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: themeHex }} />

          <div className="flex flex-col sm:flex-row items-start gap-6 min-w-0 flex-1">
            {/* Polaroid style frame for avatar */}
            <div className="bg-white p-2.5 pb-4 shadow-md rotate-1 hover:rotate-0 transition-transform duration-300 shrink-0 border border-gr-line/10 rounded-sm">
              <div className="relative h-24 w-24 bg-gr-paper/60 overflow-hidden flex items-center justify-center text-gr-text-primary font-display text-3xl font-bold uppercase shadow-inner border border-gr-line/10">
                {farmer.avatar_url ? (
                  <img src={farmer.avatar_url} alt={farmer.full_name} className="h-full w-full object-cover" />
                ) : (
                  <User size={36} className="opacity-30" />
                )}
              </div>
              <div className="mt-2 text-center font-mono text-[7px] text-gr-text-primary/30 font-bold uppercase tracking-widest leading-none">
                {farmer.full_name.split(' ')[0]}
              </div>
            </div>

            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-gr-text-primary truncate max-w-[340px]" title={farmer.full_name}>
                  {farmer.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-gr-green/10 border border-gr-green/20 text-gr-green text-[9px] uppercase tracking-widest font-mono font-extrabold px-2 py-0.5 rounded-sm shrink-0">
                  <ShieldCheck size={10} className="stroke-[2.5]" /> Terverifikasi
                </span>
              </div>

              {/* Email display and phone */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gr-text-primary/60 font-sans text-xs">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} className="opacity-60" /> {farmer.email}
                </span>
                {farmer.phone_whatsapp && (
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={12} className="opacity-60" /> {farmer.phone_whatsapp}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-gr-text-primary/50 uppercase">
                <span className="flex items-center gap-1 font-sans font-medium text-gr-text-primary">
                  <MapPin size={12} style={{ color: themeHex }} /> {locationLabel}
                </span>
                <span>•</span>
                <SellerRatingBadge avgRating={ratingsAvg} ratingCount={ratingsCount} size="sm" showCount={true} />
              </div>

              {/* Editable or static Bio */}
              {isEditing ? (
                <div className="space-y-1.5 pt-2">
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 font-bold">
                    Deskripsi / Bio Petani
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={1000}
                    placeholder={defaultBio}
                    className="w-full bg-white border border-gr-line focus:outline-none focus:ring-1 p-3 font-sans text-xs text-gr-text-primary rounded-sm transition-all shadow-xs"
                    style={{ borderColor: themeHex }}
                  />
                  <span className="block text-right font-mono text-[8px] text-gr-text-primary/30">
                    {editBio.length}/1000 karakter
                  </span>
                </div>
              ) : (
                <p className="font-sans text-xs text-gr-text-primary/60 max-w-xl leading-relaxed mt-2.5 pt-2.5 border-t border-dashed border-gr-line/30">
                  {farmerBio}
                </p>
              )}
            </div>
          </div>

          {/* Right Action column */}
          <div className="flex flex-col gap-4 min-w-[200px] border-t md:border-t-0 border-gr-line/10 pt-5 md:pt-0 justify-between shrink-0">
            {/* Customization controls if in editing mode */}
            {isEditing ? (
              <div className="space-y-4 bg-white/50 border border-gr-line/60 p-4 rounded-sm">
                <div className="space-y-2">
                  <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-text-primary/50 font-bold">
                    <Palette size={10} /> Warna Tema Halaman
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSelectedTheme(preset.value)}
                        className="h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: preset.value, borderColor: selectedTheme === preset.value ? '#ffffff' : 'transparent', borderWidth: '2px', boxShadow: selectedTheme === preset.value ? `0 0 0 1.5px ${preset.value}` : 'none' }}
                        title={preset.name}
                      >
                        {selectedTheme === preset.value && (
                          <Check size={10} className="text-white stroke-[3.5]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveChanges}
                  disabled={savingEdit}
                  className="w-full text-white font-mono text-[9px] font-bold uppercase tracking-widest py-4.5 rounded-sm shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                  style={{ backgroundColor: selectedTheme }}
                >
                  {savingEdit ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={10} /> Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-white font-mono text-[9px] font-bold uppercase tracking-widest py-3 px-4 rounded-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{ backgroundColor: themeHex }}
                  >
                    <MessageSquare size={13} /> Hubungi WhatsApp
                  </a>
                ) : (
                  <div className="font-mono text-[10px] uppercase text-gr-text-primary/40 text-center py-2 border border-dashed border-gr-line/40 rounded-sm">
                    Kontak Tidak Tersedia
                  </div>
                )}

                {/* Coordinate Information Details badge */}
                {farmer.latitude && farmer.longitude && (
                  <div className="bg-white/40 border border-gr-line/50 p-2.5 rounded-xs font-mono text-[9px] text-gr-text-primary/50 space-y-0.5 text-left">
                    <span className="block text-[8px] font-bold tracking-widest text-gr-text-primary/30 uppercase">KOORDINAT LOKASI</span>
                    <span className="block font-semibold text-gr-text-primary/70">LAT: {farmer.latitude.toFixed(5)}</span>
                    <span className="block font-semibold text-gr-text-primary/70">LNG: {farmer.longitude.toFixed(5)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick stats box */}
            <div className="grid grid-cols-2 gap-2 text-center mt-auto pt-2">
              <div className="bg-white/50 border border-gr-line/40 p-2.5 rounded-xs shadow-xs">
                <span className="block font-mono text-lg font-bold text-gr-text-primary leading-tight">
                  {products.length}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40 block mt-0.5 leading-none">
                  Produk Aktif
                </span>
              </div>
              <div className="bg-white/50 border border-gr-line/40 p-2.5 rounded-xs shadow-xs">
                <span className="block font-mono text-lg font-bold text-gr-text-primary leading-tight">
                  {ratingsCount}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40 block mt-0.5 leading-none">
                  Ulasan
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Grid layout for Products and Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Main Section: Listed Products (7/12 width) */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gr-line pb-3">
              <h2 className="font-display text-xl font-semibold text-gr-text-primary flex items-center gap-2">
                <Tag size={18} style={{ color: themeHex }} /> Hasil Panen Tersedia
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                Total: {products.length} produk
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F5]/40 border border-dashed border-gr-line/50 rounded-sm">
                <Info className="h-8 w-8 text-gr-text-primary/20 mx-auto mb-2" />
                <p className="font-sans text-sm text-gr-text-primary/40 italic">
                  Belum ada produk hasil panen yang didaftarkan saat ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product, idx) => (
                  <div key={product.id} className="h-full">
                    <ProductCard product={product} index={idx} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right Section: Commented Reviews (4/12 width) */}
          <section className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between border-b border-gr-line pb-3">
              <h2 className="font-display text-xl font-semibold text-gr-text-primary flex items-center gap-2">
                <Star size={18} style={{ color: themeHex }} /> Ulasan Pembeli
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                Avg: {ratingsAvg > 0 ? ratingsAvg.toFixed(1) : '-'}
              </span>
            </div>

            {ratings.length === 0 ? (
              <div className="p-5 text-center bg-[#FAF9F5]/40 border border-dashed border-gr-line/50 rounded-sm space-y-2">
                <Star className="h-6 w-6 text-gr-text-primary/10 mx-auto" />
                <p className="font-sans text-xs text-gr-text-primary/40 italic">
                  Belum ada ulasan dari pembeli.
                </p>
              </div>
            ) : (
              <div className="space-y-4.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {ratings.map((review) => {
                  const ratingDate = new Date(review.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  return (
                    <div
                      key={review.id}
                      className="bg-white/80 border border-gr-line/80 p-4 rounded-sm shadow-xs space-y-2 hover:border-gr-line transition-colors relative"
                    >
                      {/* Top: Rater Name & Date */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-sans text-xs font-semibold text-gr-text-primary truncate">
                          {review.rater_name || 'Pembeli Anonim'}
                        </span>
                        <span className="font-mono text-[8px] text-gr-text-primary/30 uppercase shrink-0">
                          {ratingDate}
                        </span>
                      </div>

                      {/* Middle: Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            style={{
                              fill: s <= review.score ? '#f59e0b' : 'transparent',
                              color: s <= review.score ? '#f59e0b' : '#d1d5db',
                            }}
                          />
                        ))}
                      </div>

                      {/* Bottom: Comment */}
                      {review.comment ? (
                        <p className="font-sans text-[11px] text-gr-text-primary/70 leading-relaxed italic bg-gr-bg/10 p-2 rounded-xs">
                          "{review.comment}"
                        </p>
                      ) : (
                        <p className="font-sans text-[10px] text-gr-text-primary/30 italic">
                          Tidak menulis komentar.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
