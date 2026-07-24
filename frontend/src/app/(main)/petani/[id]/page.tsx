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
  Star,
  Check,
  Palette,
  User
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

  const defaultBio = 'Petani mitra terdaftar Grove yang berdedikasi menghasilkan produk pertanian segar berkualitas premium secara berkelanjutan dari ladang lokal langsung ke meja makan Anda. Berkomitmen menjaga kelestarian alam dan transparansi harga pasar.';
  const farmerBio = farmer.bio || defaultBio;

  const waMessage = `Halo Pak/Ibu ${farmer.full_name}, saya melihat profil Anda di Grove dan berminat untuk mendiskusikan hasil panen Anda.`;
  const waUrl = farmer.phone_whatsapp ? getWhatsAppUrl(farmer.phone_whatsapp, waMessage) : null;

  return (
    <main className="relative min-h-screen bg-gr-bg pt-6 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <BgPattern />
      <FilmGrain />
      <Glow color={themePreset.glow} position="top" className="opacity-12 pointer-events-none scale-105 duration-500" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back Link & Customize mode toggle button */}
        <div className="mb-5 flex justify-between items-center">
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/45 hover:text-gr-text-primary transition-colors"
          >
            ← Kembali ke Beranda
          </Link>

          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white px-4 py-2 rounded-full hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-md hover:shadow-lg"
              style={{ backgroundColor: themeHex }}
            >
              <Palette size={11} /> {isEditing ? 'Batal Edit' : 'Personalisasi Profil'}
            </button>
          )}
        </div>

        {/* Slim & Elegant Banner Header */}
        <div className="bg-[#FAF9F5] border border-gr-line/80 p-5 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row gap-5 items-center justify-between relative overflow-hidden transition-all duration-300">
          {/* Subtle themed side bar stripe */}
          <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: themeHex }} />

          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Themed ring avatar with glowing shadow */}
            <div className="relative group shrink-0">
              <div 
                className="absolute inset-0 rounded-full blur-md opacity-25" 
                style={{ backgroundColor: themeHex }} 
              />
              <div 
                className="relative h-14 w-14 rounded-full bg-white p-0.5 border shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{ borderColor: themeHex }}
              >
                <div className="relative h-full w-full rounded-full bg-gr-paper/60 overflow-hidden flex items-center justify-center text-gr-text-primary font-display text-lg font-bold uppercase border border-gr-line/10">
                  {farmer.avatar_url ? (
                    <img src={farmer.avatar_url} alt={farmer.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <User size={22} className="opacity-30" />
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg font-bold text-gr-text-primary truncate max-w-[280px]" title={farmer.full_name}>
                  {farmer.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-gr-green/10 border border-gr-green/20 text-gr-green text-[8px] uppercase tracking-widest font-mono font-extrabold px-1.5 py-0.5 rounded-sm">
                  <ShieldCheck size={8} className="stroke-[2.5]" /> Kontak Terverifikasi
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-mono text-[9px] text-gr-text-primary/50 uppercase mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-sans font-semibold text-gr-text-primary">
                  <MapPin size={10} style={{ color: themeHex }} /> {locationLabel}
                </span>
                <span>•</span>
                <SellerRatingBadge avgRating={ratingsAvg} ratingCount={ratingsCount} size="sm" showCount={true} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white font-mono text-[9px] font-bold uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ backgroundColor: themeHex }}
              >
                <MessageSquare size={12} /> Chat WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Available Products (8/12 width) - Penebalan fokus utama */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gr-line pb-3">
              <h2 className="font-display text-lg font-bold text-gr-text-primary flex items-center gap-2">
                <Tag size={16} style={{ color: themeHex }} /> Hasil Panen Tersedia
              </h2>
              <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                {products.length} produk terdaftar
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F5]/40 border border-dashed border-gr-line/50 rounded-2xl">
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

          {/* RIGHT COLUMN: Sidebar (Bio, Customizer, Reviews) (4/12 width) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Farmer Bio & Customizer Card */}
            <div className="bg-[#FAF9F5] border border-gr-line/80 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-display text-sm font-bold text-gr-text-primary border-b border-gr-line/50 pb-2">
                Tentang Petani
              </h3>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[8px] uppercase tracking-widest text-gr-text-primary/45 font-bold">
                      Deskripsi / Bio Petani
                    </label>
                    <textarea
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={1000}
                      placeholder={defaultBio}
                      className="w-full bg-white border border-gr-line/80 focus:outline-none focus:ring-1 p-3 font-sans text-xs text-gr-text-primary rounded-xl transition-all shadow-xs"
                      style={{ borderColor: themeHex }}
                    />
                    <span className="block text-right font-mono text-[8px] text-gr-text-primary/30">
                      {editBio.length}/1000
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-text-primary/55 font-bold">
                      Warna Aksen Halaman
                    </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setSelectedTheme(preset.value)}
                          className="h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          style={{ 
                            backgroundColor: preset.value, 
                            borderColor: selectedTheme === preset.value ? '#ffffff' : 'transparent', 
                            borderWidth: '2px', 
                            boxShadow: selectedTheme === preset.value ? `0 0 0 1.5px ${preset.value}` : 'none' 
                          }}
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
                    className="w-full text-white font-mono text-[9px] font-bold uppercase tracking-widest py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                    style={{ backgroundColor: selectedTheme }}
                  >
                    {savingEdit ? <Loader2 size={10} className="animate-spin" /> : 'Simpan'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-sans text-xs text-gr-text-primary/70 leading-relaxed">
                    {farmerBio}
                  </p>

                  {/* Location Coordinate Badge */}
                  {farmer.latitude && farmer.longitude && (
                    <div className="bg-white/60 border border-gr-line/40 p-3 rounded-xl font-mono text-[8px] text-gr-text-primary/50 space-y-0.5">
                      <span className="block font-bold tracking-widest text-gr-text-primary/30 uppercase mb-1">KOORDINAT LOKASI</span>
                      <span className="block font-semibold">LINTANG: {farmer.latitude.toFixed(5)}</span>
                      <span className="block font-semibold">BUJUR: {farmer.longitude.toFixed(5)}</span>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gr-line/40">
                    <div>
                      <span className="block font-mono text-base font-bold text-gr-text-primary">
                        {products.length}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40 block mt-0.5 leading-none">
                        Produk
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-base font-bold text-gr-text-primary">
                        {ratingsCount}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40 block mt-0.5 leading-none">
                        Ulasan
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Commented Reviews List Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gr-line pb-2">
                <h3 className="font-display text-sm font-bold text-gr-text-primary flex items-center gap-1.5">
                  <Star size={15} style={{ color: themeHex }} /> Ulasan Pembeli
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                  Rata-rata: {ratingsAvg > 0 ? ratingsAvg.toFixed(1) : '-'}
                </span>
              </div>

              {ratings.length === 0 ? (
                <div className="p-6 text-center bg-[#FAF9F5]/40 border border-dashed border-gr-line/50 rounded-2xl space-y-1">
                  <Star className="h-5 w-5 text-gr-text-primary/10 mx-auto" />
                  <p className="font-sans text-[11px] text-gr-text-primary/40 italic">
                    Belum ada ulasan dari pembeli.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {ratings.map((review) => {
                    const ratingDate = new Date(review.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    return (
                      <div
                        key={review.id}
                        className="bg-white/60 backdrop-blur-xs border border-gr-line/40 p-4 rounded-xl shadow-xs space-y-2 hover:border-gr-line/85 transition-all duration-300 relative"
                      >
                        {/* Top: Name & Date */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-sans text-xs font-bold text-gr-text-primary truncate">
                            {review.rater_name || 'Pembeli Anonim'}
                          </span>
                          <span className="font-mono text-[8px] text-gr-text-primary/30 uppercase shrink-0">
                            {ratingDate}
                          </span>
                        </div>

                        {/* Stars */}
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

                        {/* Comment */}
                        {review.comment ? (
                          <p className="font-sans text-[11px] text-gr-text-primary/75 leading-relaxed italic bg-white/40 border border-gr-line/20 p-2.5 rounded-xl">
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
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
