'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { authApi } from '@/lib/api/auth';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { provinceCentroids } from '@/lib/data/province-centroids';
import { cn } from '@/lib/utils';
import { Camera, Plus, X, Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const getCategoryForCommodity = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('beras')) return 'BERAS';
  if (n.includes('bawang merah')) return 'BAWANG MERAH';
  if (n.includes('bawang putih')) return 'BAWANG PUTIH';
  if (n.includes('cabai rawit') || n.includes('rawit')) return 'CABAI RAWIT';
  if (n.includes('cabai merah') || n.includes('cabai')) return 'CABAI MERAH';
  if (n.includes('daging ayam') || n.includes('ayam')) return 'DAGING AYAM';
  if (n.includes('telur')) return 'TELUR AYAM';
  if (n.includes('daging sapi') || n.includes('sapi')) return 'DAGING SAPI';
  if (n.includes('minyak')) return 'MINYAK GORENG';
  if (n.includes('gula')) return 'GULA PASIR';
  return 'BERAS'; // Default fallback
};

export default function JualPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userData = await authApi.getMe();
        if (userData.role !== 'PETANI') {
          router.push('/settings/upgrade-to-farmer');
        } else {
          setCheckingAuth(false);
          if (userData.latitude !== undefined && userData.latitude !== null && userData.longitude !== undefined && userData.longitude !== null) {
            setLat(userData.latitude);
            setLng(userData.longitude);
            setLocationStatus(`Lokasi terisi dari profil: ${userData.latitude.toFixed(4)}, ${userData.longitude.toFixed(4)}`);
          } else {
            // Auto-fetch device location on load if profile location is empty
            if (typeof window !== 'undefined' && navigator.geolocation) {
              setLocationStatus('Mencari lokasi otomatis...');
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLat(position.coords.latitude);
                  setLng(position.coords.longitude);
                  setLocationStatus(`Lokasi terisi otomatis: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                  setLocationStatus(`Gagal memuat lokasi otomatis: ${error.message}`);
                },
                { timeout: 8000 }
              );
            }
          }
        }
      } catch (err) {
        router.replace('/login');
      }
    };
    checkRole();
  }, [router]);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'BERAS',
    quantity_kg: '',
    price_per_kg: '',
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Autocomplete & Price Advisor States
  const [allCommodities, setAllCommodities] = useState<string[]>([]);
  const [filteredCommodities, setFilteredCommodities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [refPrice, setRefPrice] = useState<number | null>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch commodities list
  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const res = await referencePricesApi.getReferencePrices(1, 1);
        if (res.distinct_commodities) {
          setAllCommodities(res.distinct_commodities);
        }
      } catch (err) {
        console.error('Failed to load commodities in sell page:', err);
      }
    };
    fetchCommodities();
  }, []);

  const fetchReferencePrice = async (commodity: string, latitude: number | null, longitude: number | null) => {
    try {
      const region = latitude && longitude ? getClosestProvince(latitude, longitude) : 'Nasional';
      
      // Concurrently query both region and national prices to load twice as fast
      const [regionRes, nationalRes] = await Promise.all([
        referencePricesApi.getReferencePrices(1, 1, commodity, region),
        region !== 'Nasional' ? referencePricesApi.getReferencePrices(1, 1, commodity, 'Nasional') : null
      ]);
      
      if (regionRes.items && regionRes.items.length > 0) {
        setRefPrice(regionRes.items[0].price_per_kg);
      } else if (nationalRes && nationalRes.items && nationalRes.items.length > 0) {
        setRefPrice(nationalRes.items[0].price_per_kg);
      } else {
        setRefPrice(null);
      }
    } catch (err) {
      console.error('Failed to fetch ref price:', err);
      setRefPrice(null);
    }
  };

  // Reactively fetch reference price when commodity name or coordinates change
  useEffect(() => {
    if (formData.name) {
      const matched = allCommodities.find(c => c.toLowerCase() === formData.name.trim().toLowerCase());
      if (matched) {
        fetchReferencePrice(matched, lat, lng);
        return;
      }
    }
    setRefPrice(null);
  }, [lat, lng, formData.name, allCommodities]);

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Browser tidak mendukung geolokasi');
      return;
    }
    setLocating(true);
    setLocationStatus('Mencari lokasi...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocating(false);
        setLocationStatus(`Lokasi terisi: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      },
      (error) => {
        setLocating(false);
        setLocationStatus(`Gagal: ${error.message}`);
      },
      { timeout: 8000 }
    );
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name: val,
      category: getCategoryForCommodity(val)
    }));
    
    if (val.trim() === '') {
      setFilteredCommodities(allCommodities);
      setShowDropdown(true);
    } else {
      const filtered = allCommodities.filter((item) =>
        item.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredCommodities(filtered);
      setShowDropdown(true);
    }
  };

  const selectCommodity = (commodity: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name: commodity,
      category: getCategoryForCommodity(commodity)
    }));
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'name') {
      handleNameChange(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError('Foto produk wajib diunggah');
      return;
    }

    // Validate commodity name against PIHPS database
    const isCommodityValid = allCommodities.some(
      (c) => c.toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (!isCommodityValid) {
      setError('Komoditas harus dipilih dari daftar acuan PIHPS yang tersedia.');
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('quantity_kg', formData.quantity_kg);
    data.append('price_per_kg', formData.price_per_kg);
    data.append('photo', photo);
    if (lat !== null) {
      data.append('lat', lat.toString());
    }
    if (lng !== null) {
      data.append('lng', lng.toString());
    }

    try {
      await productsApi.createProduct(data);
      router.push('/beranda');
    } catch (err: any) {
      setError(err.message || 'Gagal memposting produk');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gr-bg">
        <BgPattern />
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50 z-10" />
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-gr-bg py-12 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      
      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="font-display text-5xl font-medium tracking-tight text-gr-text-primary">
            Post Hasil Panen
          </h1>
          <p className="mt-4 font-sans text-gr-text-primary/60 italic">
            "Kejujuran adalah benih dari kepercayaan pelanggan."
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Polaroid Photo Preview Section */}
          <div className="flex flex-col items-center justify-start space-y-6">
            <div 
              className={cn(
                "relative bg-gr-bg-paper p-4 pb-16 shadow-2xl transition-transform duration-300 hover:rotate-1",
                !previewUrl && "flex aspect-[4/5] w-full max-w-sm items-center justify-center border-2 border-dashed border-white/10 bg-transparent"
              )}
            >
              {previewUrl ? (
                <>
                  <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="h-full w-full object-cover grayscale-[0.2] contrast-[1.1]"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={removePhoto}
                    className="absolute -right-2 -top-2 rounded-full bg-gr-price-unfair p-1 text-white shadow-lg hover:bg-gr-price-unfair/90"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="font-display text-2xl text-gr-text-paper opacity-30">
                      GROVE SHOT #001
                    </span>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center space-y-4 text-gr-text-primary/40 transition-colors hover:text-gr-green"
                >
                  <div className="rounded-full border border-current p-6 transition-transform group-hover:scale-110">
                    <Camera size={48} />
                  </div>
                  <span className="font-sans text-sm font-medium uppercase tracking-widest">
                    Klik untuk Ambil Foto
                  </span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          {/* Form Content */}
          <div className="space-y-8 rounded-2xl bg-[#FAF6EE]/95 dark:bg-[#1E1812]/95 p-8 border border-[#E4DBC5] dark:border-white/10 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="rounded bg-gr-price-unfair/10 p-4 text-sm text-gr-price-unfair border border-gr-price-unfair/20">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="relative" ref={dropdownRef}>
                <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                  Nama Komoditas
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Contoh: Cabai Rawit Merah"
                  className="mt-2 block w-full border-b border-white/20 bg-transparent py-2 font-sans text-xl text-gr-text-primary placeholder-white/10 focus:border-gr-green focus:outline-none transition-colors"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => {
                    const filtered = allCommodities.filter(item => 
                      item.toLowerCase().includes(formData.name.toLowerCase())
                    );
                    setFilteredCommodities(filtered.length > 0 ? filtered : allCommodities);
                    setShowDropdown(true);
                  }}
                />
                {showDropdown && filteredCommodities.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-gr-bg/95 backdrop-blur-xl shadow-lg z-30 divide-y divide-white/5">
                    {filteredCommodities.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectCommodity(item)}
                        className="w-full text-left px-4 py-3 font-sans text-xs text-gr-text-primary hover:text-gr-green hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                    Harga Referensi (PIHPS)
                  </label>
                  <div className="mt-2 py-2 font-mono text-xl text-gr-green border-b border-white/20 bg-transparent min-h-[42px] flex items-center">
                    {refPrice !== null ? `Rp ${refPrice.toLocaleString('id-ID')}/kg` : '-'}
                  </div>
                </div>
                <div>
                  <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                    Jumlah (KG)
                  </label>
                  <input
                    name="quantity_kg"
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    className="mt-2 block w-full border-b border-white/20 bg-transparent py-2 font-mono text-xl text-gr-text-primary focus:border-gr-green focus:outline-none"
                    value={formData.quantity_kg}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                  Harga per KG (IDR)
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-0 top-2 font-mono text-xl text-gr-text-primary/30">Rp</span>
                  <input
                    name="price_per_kg"
                    type="number"
                    required
                    placeholder="0"
                    className="block w-full border-b border-white/20 bg-transparent py-2 pl-10 font-mono text-3xl text-gr-green focus:border-gr-green focus:outline-none"
                    value={formData.price_per_kg}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Asisten Harga Adil (Price Fair Assistant) Box */}
              {refPrice !== null && formData.price_per_kg && (
                <div className="mt-2 font-sans text-xs">
                  {parseFloat(formData.price_per_kg) < 0.75 * refPrice && (
                    <div className="rounded-2xl bg-gr-down/10 p-4 text-gr-down border border-gr-down/20 flex gap-2 items-start">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Peringatan: Harga Terlalu Murah</span>
                        <p className="mt-1 leading-relaxed">
                          Harga pasar rata-rata saat ini adalah <strong>Rp {refPrice.toLocaleString('id-ID')}/kg</strong>. Anda menjual jauh di bawah pasar seharga <strong>Rp {parseFloat(formData.price_per_kg).toLocaleString('id-ID')}/kg</strong>. Anda bisa meningkatkan harga hingga <strong>Rp {Math.round(0.85 * refPrice).toLocaleString('id-ID')}/kg</strong> dan tetap kompetitif tanpa merugikan hasil kerja keras Anda.
                        </p>
                      </div>
                    </div>
                  )}
                  {parseFloat(formData.price_per_kg) > 1.20 * refPrice && (
                    <div className="rounded-2xl bg-gr-board/10 p-4 text-gr-board border border-gr-board/20 flex gap-2 items-start">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-semibold block">Peringatan: Harga Cukup Tinggi</span>
                        <p className="mt-1 leading-relaxed">
                          Harga Anda (<strong>Rp {parseFloat(formData.price_per_kg).toLocaleString('id-ID')}/kg</strong>) berada di atas harga pasar rata-rata (<strong>Rp {refPrice.toLocaleString('id-ID')}/kg</strong>). Produk Anda mungkin membutuhkan waktu lebih lama untuk laku oleh pembeli.
                        </p>
                      </div>
                    </div>
                  )}
                  {parseFloat(formData.price_per_kg) >= 0.75 * refPrice && parseFloat(formData.price_per_kg) <= 1.20 * refPrice && (
                    <div className="rounded-2xl bg-gr-up/10 p-4 text-gr-up border border-gr-up/20 flex gap-2 items-start">
                      <CheckCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Harga Adil & Kompetitif</span>
                        <p className="mt-1 leading-relaxed">
                          Harga Anda kompetitif dengan rata-rata harga acuan harga pasar wilayah saat ini (<strong>Rp {refPrice.toLocaleString('id-ID')}/kg</strong>).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                  Lokasi Produk
                </label>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locating}
                      className="px-4 py-2 border border-white/10 hover:border-gr-green text-xs font-mono uppercase tracking-wider bg-white/5 hover:bg-gr-green/10 text-gr-text-primary transition-all duration-200"
                    >
                      {locating ? 'Mencari...' : 'Gunakan Lokasi Saat Ini'}
                    </button>
                    {locationStatus && (
                      <span className="font-mono text-[10px] text-gr-green">
                        {locationStatus}
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-[10px] text-gr-text-primary/40 italic">
                    Kalau tidak diisi, produk akan pakai lokasi profil kamu.
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-[0.2em] py-8 rounded-none transition-all hover:tracking-[0.3em]"
            >
              {loading ? 'Mengunggah...' : 'Publish Hasil Panen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
