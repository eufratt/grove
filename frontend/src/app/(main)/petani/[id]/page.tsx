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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

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

  // Reset page to 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

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
        <div className="relative z-10 max-w-md w-full bg-white/80 border-2 border-gr-ink p-8 rounded-sm text-center shadow-xl">
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

  // Pagination calculation
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Smooth scroll to top of products list
    const el = document.getElementById('available-harvest');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="relative min-h-screen bg-gr-bg pt-8 pb-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <BgPattern />
      <FilmGrain />
      <Glow color={themePreset.glow} position="top" className="opacity-12 pointer-events-none scale-105 duration-500" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back Link & Customize mode toggle button */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/60 hover:text-gr-text-primary transition-colors font-extrabold"
          >
            ← Kembali ke Beranda
          </Link>

          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white px-4.5 py-2.5 border-2 border-gr-ink rounded-full hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-[3px_3px_0px_0px_#201d16]"
              style={{ backgroundColor: themeHex }}
            >
              <Palette size={11} /> {isEditing ? 'Batal Edit' : 'Personalisasi Profil'}
            </button>
          )}
        </div>

        {/* Poster Style Slim Banner Header */}
        <div 
          className="bg-[#FCFAF2] border-2 border-gr-ink p-4 sm:p-5 rounded-2xl mb-8 flex flex-col sm:flex-row gap-5 items-center justify-between relative overflow-hidden transition-all duration-300"
          style={{ boxShadow: `5px 5px 0px 0px ${themeHex}` }}
        >
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
                className="relative h-14 w-14 rounded-full bg-white p-0.5 border-2 border-gr-ink shadow-sm transition-transform duration-300 group-hover:scale-105"
              >
                <div className="relative h-full w-full rounded-full bg-gr-paper/60 overflow-hidden flex items-center justify-center text-gr-text-primary font-display text-lg font-bold uppercase">
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
                <h1 className="font-display text-xl font-black uppercase tracking-tight text-gr-ink truncate max-w-[280px]" title={farmer.full_name}>
                  {farmer.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-gr-board text-gr-chalk text-[8px] uppercase tracking-widest font-mono font-extrabold px-2 py-0.5 border border-gr-ink rounded-sm">
                  <ShieldCheck size={8} className="stroke-[2.5]" /> Kontak Terverifikasi
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-mono text-[9px] text-gr-text-primary/60 uppercase mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-sans font-extrabold text-gr-text-primary">
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
                className="inline-flex items-center gap-1.5 text-white font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 px-4.5 border-2 border-gr-ink rounded-xl shadow-[3px_3px_0px_0px_#201d16] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#201d16] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#201d16] transition-all"
                style={{ backgroundColor: themeHex }}
              >
                <MessageSquare size={12} /> Chat WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* 2-Column Dashboard Layout: 9/12 for Products, 3/12 for Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Available Products (9/12 width) */}
          <section id="available-harvest" className="lg:col-span-9 space-y-6 scroll-mt-6">
            <div className="flex items-center justify-between border-b-2 border-gr-ink pb-3">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gr-ink flex items-center gap-2">
                <Tag size={18} style={{ color: themeHex }} className="stroke-[2.5]" /> Hasil Panen Tersedia
              </h2>
              <span className="font-mono text-xs font-bold bg-gr-ink text-gr-paper px-2 py-0.5 rounded-sm uppercase tracking-wider">
                {products.length} Komoditas
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F5]/40 border-2 border-dashed border-gr-line rounded-2xl">
                <Info className="h-8 w-8 text-gr-text-primary/20 mx-auto mb-2" />
                <p className="font-sans text-sm text-gr-text-primary/40 italic">
                  Belum ada produk hasil panen yang didaftarkan saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {currentProducts.map((product, idx) => (
                    <div key={product.id} className="h-full transform hover:scale-[1.01] transition-transform duration-300">
                      <ProductCard product={product} index={idx} />
                    </div>
                  ))}
                </div>

                {/* Highly Visible Retro-Poster Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-6 border-t-2 border-gr-ink font-mono text-xs font-bold uppercase tracking-wider text-gr-ink">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 border-2 border-gr-ink bg-white text-gr-ink rounded-xl shadow-[3px_3px_0px_0px_#201d16] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#201d16] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#201d16] transition-all disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="font-mono text-xs font-extrabold bg-[#FCFAF2] border-2 border-gr-ink px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(32,29,22,0.1)]">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2.5 border-2 border-gr-ink bg-white text-gr-ink rounded-xl shadow-[3px_3px_0px_0px_#201d16] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#201d16] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#201d16] transition-all disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Sidebar (Bio, Customizer, Reviews) (3/12 width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. Chalkboard Style "Tentang Petani" Card */}
            <div 
              className="bg-gr-board text-gr-chalk border-2 border-gr-ink p-5 rounded-2xl relative shadow-[5px_5px_0px_0px_#201d16] transition-all duration-300"
              style={{ boxShadow: `5px 5px 0px 0px ${themeHex}` }}
            >
              <h3 className="font-display text-xs font-black uppercase tracking-widest border-b border-gr-chalk/20 pb-2 text-gr-chalk flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-gr-ink shrink-0" style={{ backgroundColor: themeHex }} />
                Tentang Petani
              </h3>

              {isEditing ? (
                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[8px] uppercase tracking-widest text-gr-chalk-soft font-bold">
                      Deskripsi / Bio Petani
                    </label>
                    <textarea
                      rows={5}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={1000}
                      placeholder={defaultBio}
                      className="w-full bg-white/10 border border-gr-chalk/35 focus:outline-none focus:ring-1 focus:ring-gr-chalk p-2.5 font-sans text-xs text-gr-chalk rounded-xl transition-all shadow-inner"
                    />
                    <span className="block text-right font-mono text-[8px] text-gr-chalk-soft">
                      {editBio.length}/1000
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-chalk-soft font-bold">
                      Warna Aksen Halaman
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setSelectedTheme(preset.value)}
                          className="h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer transition-transform hover:scale-115 active:scale-90"
                          style={{ 
                            backgroundColor: preset.value, 
                            borderColor: selectedTheme === preset.value ? '#ffffff' : 'transparent', 
                            borderWidth: '2.5px', 
                            boxShadow: selectedTheme === preset.value ? `0 0 0 1.5px ${preset.value}` : 'none' 
                          }}
                          title={preset.name}
                        >
                          {selectedTheme === preset.value && (
                            <Check size={8} className="text-white stroke-[4]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveChanges}
                    disabled={savingEdit}
                    className="w-full text-gr-board bg-gr-chalk font-mono text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border-2 border-gr-ink shadow-[2px_2px_0px_0px_#201d16] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#201d16] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#201d16] transition-all cursor-pointer"
                  >
                    {savingEdit ? <Loader2 size={10} className="animate-spin text-gr-board" /> : 'Simpan'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <p className="font-sans text-xs text-gr-chalk/90 leading-relaxed italic">
                    "{farmerBio}"
                  </p>

                  {/* Stamp style location coordinates */}
                  {farmer.latitude && farmer.longitude && (
                    <div className="bg-white/10 border-2 border-dashed border-gr-chalk/20 p-3 rounded-xl font-mono text-[8px] text-gr-chalk/80 space-y-0.5 relative overflow-hidden">
                      <span className="block font-black tracking-widest text-gr-chalk-soft uppercase mb-1">KOORDINAT LOKASI</span>
                      <span className="block font-semibold">LINTANG: {farmer.latitude.toFixed(5)}</span>
                      <span className="block font-semibold">BUJUR: {farmer.longitude.toFixed(5)}</span>
                    </div>
                  )}

                  {/* High contrast chalkboard stats */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-gr-chalk/20">
                    <div className="border-r border-gr-chalk/10">
                      <span className="block font-display text-xl font-black text-gr-chalk leading-none">
                        {products.length}
                      </span>
                      <span className="font-mono text-[7px] uppercase tracking-widest text-gr-chalk-soft block mt-1 leading-none">
                        PRODUK
                      </span>
                    </div>
                    <div>
                      <span className="block font-display text-xl font-black text-gr-chalk leading-none">
                        {ratingsCount}
                      </span>
                      <span className="font-mono text-[7px] uppercase tracking-widest text-gr-chalk-soft block mt-1 leading-none">
                        ULASAN
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Poster Style Commented Reviews List Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-gr-ink pb-2">
                <h3 className="font-display text-xs font-black uppercase tracking-tight text-gr-ink flex items-center gap-1.5">
                  <Star size={14} style={{ color: themeHex }} className="stroke-[2.5]" /> Ulasan Pembeli
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink/60 font-bold">
                  Avg: {ratingsAvg > 0 ? ratingsAvg.toFixed(1) : '-'}
                </span>
              </div>

              {ratings.length === 0 ? (
                <div className="p-6 text-center bg-[#FAF9F5]/40 border-2 border-dashed border-gr-ink/30 rounded-2xl space-y-1">
                  <Star className="h-5 w-5 text-gr-text-primary/10 mx-auto" />
                  <p className="font-sans text-[11px] text-gr-text-primary/40 italic">
                    Belum ada ulasan dari pembeli.
                  </p>
                </div>
              ) : (
                <div className="space-y-4.5 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {ratings.map((review) => {
                    const ratingDate = new Date(review.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    return (
                      <div
                        key={review.id}
                        className="bg-[#FCFAF2] border-2 border-gr-ink p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(32,29,22,0.15)] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(32,29,22,0.15)] transition-all duration-300 relative"
                      >
                        {/* Top: Name & Date */}
                        <div className="flex justify-between items-center gap-2 border-b border-gr-ink/10 pb-1.5 mb-2">
                          <span className="font-sans text-xs font-bold text-gr-ink truncate">
                            {review.rater_name || 'Pembeli Anonim'}
                          </span>
                          <span className="font-mono text-[8px] text-gr-text-primary/40 uppercase shrink-0 font-bold">
                            {ratingDate}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5 mb-2">
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
                          <p className="font-sans text-[11px] text-gr-text-primary/80 leading-relaxed italic bg-white/60 border border-gr-line/10 p-2.5 rounded-lg">
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
