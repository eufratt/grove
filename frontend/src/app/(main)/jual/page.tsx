'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { cn } from '@/lib/utils';
import { Camera, Plus, X } from 'lucide-react';

export default function JualPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'SAYUR',
    quantity_kg: '',
    price_per_kg: '',
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('quantity_kg', formData.quantity_kg);
    data.append('price_per_kg', formData.price_per_kg);
    data.append('photo', photo);

    try {
      await productsApi.createProduct(data);
      router.push('/beranda');
    } catch (err: any) {
      setError(err.message || 'Gagal memposting produk');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="space-y-8 rounded-2xl bg-white/5 p-8 backdrop-blur-xl border border-white/10">
            {error && (
              <div className="rounded bg-gr-price-unfair/10 p-4 text-sm text-gr-price-unfair border border-gr-price-unfair/20">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                  Nama Komoditas
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Contoh: Cabai Rawit Merah"
                  className="mt-2 block w-full border-b border-white/20 bg-transparent py-2 font-sans text-xl text-gr-text-primary placeholder-white/10 focus:border-gr-green focus:outline-none transition-colors"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-xs font-medium uppercase tracking-widest text-gr-text-primary/50">
                    Kategori
                  </label>
                  <select
                    name="category"
                    className="mt-2 block w-full border-b border-white/20 bg-transparent py-2 font-mono text-sm uppercase tracking-widest text-gr-green focus:border-gr-green focus:outline-none"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="SAYUR">SAYUR</option>
                    <option value="BUAH">BUAH</option>
                    <option value="UMBI">UMBI</option>
                    <option value="REMPAH">REMPAH</option>
                  </select>
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
