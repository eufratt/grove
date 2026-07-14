'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { provinceCentroids } from '@/lib/data/province-centroids';
import Link from 'next/link';

// Fix for leaflet default icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom user location marker icon with solid center and pulsing animation ring
const userIcon = typeof window !== 'undefined' ? L.divIcon({
  className: 'custom-user-marker',
  html: '<div class="user-marker-dot"></div><div class="user-marker-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
}) : undefined;

// Component to handle map centering and flyTo transition effects
function MapController({ 
  center, 
  zoom, 
  flyToCoords 
}: { 
  center: [number, number]; 
  zoom: number; 
  flyToCoords?: [number, number] | null 
}) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo(flyToCoords, 8, {
        animate: true,
        duration: 1.2
      });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, flyToCoords, map]);
  return null;
}

interface MapViewProps {
  mode?: 'products' | 'pricing';
  
  // Products mode parameters
  products?: any[];
  radiusKm?: number;
  locationError?: string | null;
  
  // Pricing mode parameters
  pricesByProvince?: Record<string, any[]>;
  selectedProvince?: string | null;
  onSelectProvince?: (province: string) => void;
  
  // Common parameters
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ 
  mode = 'products',
  products = [],
  radiusKm = 10,
  locationError,
  pricesByProvince = {},
  selectedProvince = null,
  onSelectProvince,
  center = [-6.2000, 106.8166], // Default Jakarta
  zoom = 13,
  userLocation,
  className 
}) => {

  // Dynamic coordinates transition mapping for pricing mode
  let activeCenter = center;
  let activeZoom = zoom;
  let flyToCoords: [number, number] | null = null;

  if (mode === 'pricing') {
    if (selectedProvince && provinceCentroids[selectedProvince]) {
      const centroid = provinceCentroids[selectedProvince];
      flyToCoords = [centroid.lat, centroid.lng];
      activeCenter = flyToCoords;
      activeZoom = 8;
    } else {
      activeCenter = [-2.5489, 118.0149]; // Center of Indonesia
      activeZoom = 5;
    }
  }

  // Create styled dot marker icon for each province (no text inside, size scales with density)
  const createProvinceIcon = (provinceName: string, density: number, isSelected: boolean) => {
    const size = Math.min(16, Math.max(10, 8 + density * 0.6));
    const bgColor = isSelected ? 'var(--gr-orange)' : 'var(--gr-green)';
    const shadowColor = isSelected ? 'rgba(255, 155, 113, 0.7)' : 'rgba(92, 255, 158, 0.5)';
    const shadowRadius = isSelected ? '12px' : '8px';
    return L.divIcon({
      className: `prov-dot-${provinceName.replace(/\s+/g, '-')}`,
      html: `
        <div style="
          background-color: ${bgColor}; 
          border: 2px solid white; 
          border-radius: 9999px; 
          width: ${size}px; 
          height: ${size}px; 
          box-shadow: 0 0 ${shadowRadius} ${shadowColor};
          transition: all 0.25s ease;
          cursor: pointer;
        "></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  return (
    <div className={cn("h-full w-full overflow-hidden relative bg-[#07080F]", className)}>
      {/* Location warning alert banner */}
      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md bg-[#07080F]/90 border border-gr-orange/30 text-gr-text-primary px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest rounded-full shadow-2xl backdrop-blur-md text-center flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gr-orange animate-pulse" />
          <span>{locationError}</span>
        </div>
      )}

      <MapContainer 
        center={activeCenter} 
        zoom={activeZoom} 
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full z-10"
      >
        <MapController center={activeCenter} zoom={activeZoom} flyToCoords={flyToCoords} />
        <ZoomControl position="bottomright" />
        
        {/* CartoDB Dark Matter Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Location Marker & Search Radius Visual */}
        {userLocation && userIcon && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup className="custom-popup">
                <div className="p-1 font-sans text-xs text-gr-bg font-bold text-center">
                  Lokasi Anda
                </div>
              </Popup>
            </Marker>
            
            {mode === 'products' && (
              <Circle
                center={userLocation}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: 'var(--gr-green)',
                  fillColor: 'var(--gr-green)',
                  fillOpacity: 0.06,
                  weight: 1,
                  dashArray: '4,4'
                }}
              />
            )}
          </>
        )}

        {/* 1. Products Mode Markers */}
        {mode === 'products' && products.map((product) => (
          product.latitude && product.longitude && (
            <Marker 
              key={product.id} 
              position={[product.latitude, product.longitude]}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[160px] text-[#07080F]">
                  {product.photo_url && (
                    <img 
                      src={product.photo_url} 
                      alt={product.name} 
                      className="w-full h-24 object-cover rounded-md mb-2" 
                    />
                  )}
                  <h3 className="font-display text-base font-semibold m-0 text-gr-bg">
                    {product.name}
                  </h3>
                  <p className="font-mono text-xs text-emerald-700 font-bold mt-0.5">
                    Rp {product.price_per_kg.toLocaleString('id-ID')}/KG
                  </p>
                  <p className="font-sans text-[10px] text-gray-500 mt-1">
                    Stok: {product.quantity_kg} KG
                  </p>
                  {product.distance_km !== undefined && product.distance_km !== null && (
                    <p className="font-sans text-[10px] text-gr-orange font-bold mt-1">
                      {product.distance_km.toFixed(1)} km dari Anda
                    </p>
                  )}
                  <Link 
                    href={`/produk/${product.id}`}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[9px] font-bold uppercase tracking-wider py-1.5 rounded transition-all cursor-pointer block text-center"
                  >
                    Detail Produk
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* 2. Pricing Mode Markers (Indonesian Provinces) */}
        {mode === 'pricing' && Object.entries(pricesByProvince).map(([provName, list]) => {
          const coords = provinceCentroids[provName];
          if (!coords) return null;

          const isSelected = selectedProvince === provName;
          const density = list.length;
          const markerIcon = createProvinceIcon(provName, density, isSelected);

          // Get top 3 commodities
          const topList = list.slice(0, 3);

          return (
            <Marker
              key={provName}
              position={[coords.lat, coords.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectProvince?.(provName)
              }}
            >
              <Tooltip direction="bottom" offset={[0, 8]} opacity={0.9}>
                <span className="font-sans font-bold text-xs text-[#07080F]">
                  {provName}
                </span>
              </Tooltip>
              
              <Popup className="custom-popup">
                <div className="p-2 font-sans w-48 text-[#07080F]">
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-gr-orange">
                    {provName}
                  </h4>
                  <div className="space-y-1 divide-y divide-gray-100">
                    {topList.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-1 text-[11px]">
                        <span className="font-medium truncate max-w-[100px]" title={item.commodity_name}>
                          {item.commodity_name}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 shrink-0">
                          Rp {item.price_per_kg.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => onSelectProvince?.(provName)}
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[9px] font-bold uppercase tracking-wider py-1.5 rounded transition-all cursor-pointer"
                  >
                    Lihat Rincian Sidebar
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style jsx global>{`
        /* Leaflet Popup overrides for clean theme */
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        
        /* Custom User Location Marker Styling */
        .custom-user-marker {
          position: relative;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .user-marker-dot {
          width: 10px;
          height: 10px;
          background-color: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px #3b82f6;
          z-index: 2;
        }
        .user-marker-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: rgba(59, 130, 246, 0.35);
          border-radius: 50%;
          animation: pulse-ring 2s infinite ease-out;
          z-index: 1;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.4);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
