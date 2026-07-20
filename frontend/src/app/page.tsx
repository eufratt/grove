'use client';

import React, { useEffect, useState } from 'react';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { 
  Ticker, 
  KickerBar, 
  MastheadNav, 
  HeroHeadline, 
  LedeSection, 
  QuoteSection, 
  FigPanels, 
  LandingFooter 
} from '@/components/scattered-hero';

export default function LandingPage() {
  const [pricesData, setPricesData] = useState<any[]>([]);
  const [tickerData, setTickerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      try {
        const commodities = [
          {
            name: 'Cabai Rawit Merah',
            displayName: 'Cabai rawit merah',
            desc: 'Meningkat seiring fluktuasi pasokan di pasar-pasar induk utama Jawa Barat dan sekitarnya.',
            swatchColor: 'var(--gr-up)'
          },
          {
            name: 'Bawang Merah',
            displayName: 'Bawang merah',
            desc: 'Melandai setelah pasokan panen serentak dari wilayah sentra produksi Brebes membanjiri pasar.',
            swatchColor: 'var(--gr-down)'
          },
          {
            name: 'Telur Ayam Ras Segar',
            displayName: 'Telur ayam ras segar',
            desc: 'Bergerak dalam rentang stabil sejalan dengan konsistensi rantai pasokan peternak lokal.',
            swatchColor: 'var(--gr-ink-soft)'
          }
        ];

        const formatShortDate = (dateStr: string) => {
          const date = new Date(dateStr);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
          return `${date.getDate()} ${months[date.getMonth()]}`;
        };

        const results = await Promise.all(
          commodities.map(async (c) => {
            // Get history (last 10 days)
            const history = await referencePricesApi.getPriceHistory(c.name, 'Nasional', 10);
            
            // If history exists, extract latest price and delta compared to last different price
            if (history && history.length > 0) {
              const latestEntry = history[history.length - 1];
              const priceToday = latestEntry.price_per_kg;
              
              // Find the last day's entry that has a different price
              let comparisonEntry = latestEntry;
              for (let i = history.length - 2; i >= 0; i--) {
                if (history[i].price_per_kg !== priceToday) {
                  comparisonEntry = history[i];
                  break;
                }
              }
              const priceComparison = comparisonEntry.price_per_kg;
              const comparisonDate = formatShortDate(comparisonEntry.scraped_at);
              
              // Calculate delta compared to last different price
              const delta = priceComparison > 0 
                ? ((priceToday - priceComparison) / priceComparison) * 100 
                : 0;

              return {
                commodityName: c.displayName,
                priceToday,
                priceComparison,
                delta,
                comparisonDate,
                history,
                desc: c.desc,
                swatchColor: c.swatchColor
              };
            }
            return null;
          })
        );

        const validResults = results.filter(r => r !== null);
        if (validResults.length > 0) {
          setPricesData(validResults);
          
          // Format for ticker
          const tickerItems = validResults.map(r => ({
            commodityName: r.commodityName.toUpperCase(),
            priceToday: r.priceToday,
            delta: r.delta
          }));
          setTickerData(tickerItems);
        }
      } catch (err) {
        console.error('Failed to load reference prices for landing page:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPrices();
  }, []);

  return (
    <main className="relative min-h-screen bg-gr-paper text-gr-ink flex flex-col justify-start overflow-x-hidden font-sans">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />

      {/* 1. Ticker */}
      <Ticker pricesData={tickerData} />

      {/* 2. Kicker bar */}
      <KickerBar />

      {/* 3. Masthead Nav */}
      <MastheadNav />

      {/* 4. Hero Headline */}
      <HeroHeadline />

      {/* 5. Lede + How to read */}
      <LedeSection />

      {/* 6. Quote Section */}
      <QuoteSection />

      {/* 7. Fig 1 Panels */}
      <FigPanels pricesData={pricesData} />

      {/* 8. Footer */}
      <LandingFooter />
    </main>
  );
}
