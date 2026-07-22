'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { authApi } from '@/lib/api/auth';
import { searchApi } from '@/lib/api/search';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BASE_URL } from '@/lib/api/client';
import { SwipeDeck } from '@/components/products/swipe-deck';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Loader2, Compass, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function JelajahPage() {
  const [demandRequests, setDemandRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Commodity filtering states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allCommodities, setAllCommodities] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const lastSearchedQuery = useRef<string>('');

  const fetchDemandRequests = async () => {
    setIsLoading(true);
    try {
      const data = await demandRequestsApi.getOpenDemandRequests();
      const sorted = data.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      setDemandRequests(sorted);
    } catch (error) {
      console.error('Failed to fetch demand requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Jelajah geolocation error:", error.message);
        },
        { timeout: 8000 }
      );
    }
  };

  // Fetch commodities dropdown list from reference prices
  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const res = await referencePricesApi.getReferencePrices(1, 1);
        if (res.distinct_commodities) {
          setAllCommodities(res.distinct_commodities);
        }
      } catch (err) {
        console.error('Failed to load commodities in jelajah:', err);
      }
    };
    fetchCommodities();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
      await fetchDemandRequests();
      requestLocation();
    };
    init();
  }, []);

  const executeSearch = useCallback(async (query: string, force = false) => {
    const trimmed = query.trim();
    if (trimmed === lastSearchedQuery.current && !force) return;
    lastSearchedQuery.current = trimmed;

    if (trimmed === '') {
      await fetchDemandRequests();
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchApi.semanticSearchDemands(trimmed);
      const queryLower = trimmed.toLowerCase();
      
      const directMatches: any[] = [];
      const semanticMatches: any[] = [];

      data.forEach((item: any) => {
        const nameLower = item.commodity_name.toLowerCase();
        if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
          directMatches.push(item);
        } else {
          semanticMatches.push(item);
        }
      });

      // Sort both arrays by deadline ascending (closest first)
      directMatches.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      semanticMatches.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

      // Combine: direct matches first (so they are placed on the far right / top of stack)
      const sorted = directMatches.concat(semanticMatches);
      setDemandRequests(sorted);
    } catch (error) {
      console.error('Failed to perform semantic search on demand requests:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      const filtered = allCommodities.filter(comm =>
        comm.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  const selectSuggestion = (comm: string) => {
    setSearchQuery(comm);
    setShowSuggestions(false);
    executeSearch(comm, true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    executeSearch('', true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      executeSearch(searchQuery, true);
    }
  };

  // Filter requests
  const filteredRequests = demandRequests;

  return (
    <main className="relative flex-1 bg-gr-paper py-10 overflow-hidden min-h-[calc(100vh-80px)]">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 md:px-8">
        <header className="mb-6 text-center">
          <h1 className="font-display text-3xl md:text-4xl text-gr-ink font-bold">
            Jelajah Permintaan Pangan
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-ink-soft max-w-lg mx-auto">
            Temukan dan penuhi permintaan kebutuhan pangan langsung dari pembeli di sekitar lokasi Anda.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-gr-line to-transparent" />
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-board animate-spin opacity-60" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-ink-soft">
              Memuat permintaan...
            </span>
          </div>
        ) : (!user || user.role === 'PEMBELI') ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 max-w-md mx-auto bg-gr-paper border border-gr-line p-8 rounded-3xl shadow-sm backdrop-blur-xl">
            <Compass className="h-16 w-16 text-gr-board animate-pulse" />
            <h3 className="font-display text-2xl text-gr-ink">Mode Jelajah Terbatas</h3>
            <p className="font-sans text-sm text-gr-ink-soft leading-relaxed">
              Mode Jelajah (Swipe Deck) dirancang khusus bagi para petani untuk menemukan dan berkomitmen memenuhi permintaan hasil panen dari pembeli.
            </p>
            <div className="bg-gr-board/5 border border-gr-board/10 p-4 rounded-2xl text-xs text-gr-board font-sans leading-relaxed">
              Sebagai pembeli, kamu bisa mengajukan permintaan di sini untuk dipenuhi oleh petani lokal.
            </div>
            <Link
              href="/permintaan-saya"
              className="inline-flex items-center gap-2 bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-sans text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all cursor-pointer shadow-sm"
            >
              Ajukan Permintaan Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-6 w-full mx-auto">
            {/* Premium Autocomplete Search Filter */}
            <div className="relative w-full max-w-[340px] mx-auto z-40">
              <div className="relative flex items-center bg-white border border-gr-line rounded-full shadow-xs px-3.5 py-2 hover:border-gr-ink-soft/45 transition-all">
                {isSearching ? (
                  <Loader2 size={14} className="text-gr-board animate-spin shrink-0 mr-2" />
                ) : (
                  <Search size={14} className="text-gr-ink-soft shrink-0 mr-2" />
                )}
                <input
                  type="text"
                  placeholder="Cari komoditas..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() !== '') setShowSuggestions(true);
                  }}
                  className="w-full bg-transparent text-gr-ink placeholder-gr-ink-soft/60 focus:outline-none font-sans text-xs"
                />
                {searchQuery !== '' && (
                  <button
                    onClick={clearSearch}
                    className="p-1 hover:bg-gr-paper rounded-full text-gr-ink-soft cursor-pointer transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gr-line rounded-2xl shadow-lg max-h-48 overflow-y-auto z-50 text-left py-1 font-sans text-xs">
                  {suggestions.map((comm) => (
                    <button
                      key={comm}
                      onClick={() => selectSuggestion(comm)}
                      className="w-full text-left px-4 py-2 hover:bg-gr-paper text-gr-ink hover:text-gr-board transition-colors cursor-pointer block"
                    >
                      {comm}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <SwipeDeck
              requests={filteredRequests}
              userLat={userLocation?.[0]}
              userLng={userLocation?.[1]}
              onSwipeRight={fetchDemandRequests}
              onSwipeLeft={(r) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Skipped demand: ${r.commodity_name}`);
                }
              }}
              onEmpty={fetchDemandRequests}
            />
          </div>
        )}
      </div>
    </main>
  );
}
