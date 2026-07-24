'use client';

import React, { useState, useEffect, use } from 'react';
import { authApi } from '@/lib/api/auth';
import { productsApi } from '@/lib/api/products';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { SellerRatingBadge } from '@/components/ratings/seller-rating-badge';
import { ProductCard } from '@/components/products/product-card';
import { provinceCentroids } from '@/lib/data/province-centroids';
import { ArrowLeft, Loader2, MapPin, MessageSquare, ShieldCheck, Tag, Info, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function FarmerProfilePage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [farmer, setFarmer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchFarmerData = async () => {
      setLoading(true);
      setError('');
      try {
        const [farmerData, productsData] = await Promise.all([
          authApi.getUserById(id),
          productsApi.getProducts(0, 100, id)
        ]);

        if (farmerData.role !== 'PETANI') {
          throw new Error('Pengguna ini bukan merupakan petani mitra Grove.');
        }

        setFarmer(farmerData);
        setProducts(productsData);
      } catch (err: any) {
        console.error('Failed to load farmer profile:', err);
        setError(err.message || 'Gagal memuat profil petani.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [id]);

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

  const locationLabel = farmer.latitude && farmer.longitude
    ? getClosestProvince(farmer.latitude, farmer.longitude)
    : 'Nasional';

  // Placeholder description / Dynamic bio
  const bio = `Petani mitra terverifikasi Grove yang berdedikasi menghasilkan produk pertanian segar berkualitas premium secara berkelanjutan dari ladang lokal langsung ke meja makan Anda. Berkomitmen menjaga kelestarian alam dan transparansi harga pasar.`;

  const waMessage = `Halo Pak/Ibu ${farmer.full_name}, saya melihat profil Anda di Grove dan berminat untuk mendiskusikan hasil panen Anda.`;
  const waUrl = farmer.phone_whatsapp ? getWhatsAppUrl(farmer.phone_whatsapp, waMessage) : null;

  return (
    <main className="relative min-h-screen bg-gr-bg pt-6 pb-16 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-8 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        {/* Farmer Header Info Card */}
        <div className="bg-[#FAF9F5] border border-gr-line p-6 sm:p-8 rounded-sm shadow-md mb-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar / Profile Pic */}
            <div className="relative h-20 w-20 rounded-full border border-gr-line bg-gr-paper/60 overflow-hidden flex items-center justify-center text-gr-green font-display text-2xl font-bold uppercase shrink-0 shadow-inner">
              {farmer.avatar_url ? (
                <img src={farmer.avatar_url} alt={farmer.full_name} className="h-full w-full object-cover" />
              ) : (
                farmer.full_name.charAt(0)
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-gr-text-primary truncate max-w-[320px]" title={farmer.full_name}>
                  {farmer.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-gr-green/10 border border-gr-green/20 text-gr-green text-[9px] uppercase tracking-widest font-mono font-extrabold px-2 py-0.5 rounded-sm">
                  <ShieldCheck size={10} /> Terverifikasi
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-gr-text-primary/50 uppercase">
                <span className="flex items-center gap-1 font-sans">
                  <MapPin size={12} className="text-gr-green" /> {locationLabel}
                </span>
                <span>•</span>
                <SellerRatingBadge avgRating={farmer.seller_rating_avg} ratingCount={farmer.seller_rating_count} size="sm" showCount={true} />
              </div>

              {/* Bio/Deskripsi */}
              <p className="font-sans text-xs text-gr-text-primary/60 max-w-xl leading-relaxed mt-2 pt-2 border-t border-dashed border-gr-line/30">
                {bio}
              </p>
            </div>
          </div>

          {/* Contact & Quick Stats Action */}
          <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 border-gr-line/20 pt-4 md:pt-0">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-gr-green text-gr-bg hover:bg-gr-green/95 font-mono text-[10px] font-bold uppercase tracking-widest py-3 px-4 rounded-sm shadow-md transition-all"
              >
                <MessageSquare size={13} /> Hubungi WhatsApp
              </a>
            ) : (
              <div className="font-mono text-[10px] uppercase text-gr-text-primary/40 text-center py-2 border border-dashed border-gr-line/40 rounded-sm">
                Kontak Tidak Tersedia
              </div>
            )}

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2 text-center mt-1">
              <div className="bg-gr-paper/30 border border-gr-line/60 p-2 rounded-xs">
                <span className="block font-mono text-base font-bold text-gr-text-primary">
                  {products.length}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40">
                  Produk Aktif
                </span>
              </div>
              <div className="bg-gr-paper/30 border border-gr-line/60 p-2 rounded-xs">
                <span className="block font-mono text-base font-bold text-gr-text-primary">
                  {farmer.seller_rating_count || 0}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-gr-text-primary/40">
                  Transaksi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Farmer Products Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gr-line pb-3">
            <h2 className="font-display text-xl font-semibold text-gr-text-primary flex items-center gap-2">
              <Tag size={18} className="text-gr-green" /> Hasil Panen Tersedia
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} index={idx} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
