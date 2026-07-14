'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { provinceCentroids } from '@/lib/data/province-centroids';
import { cn } from '@/lib/utils';

// Helper component to handle map movement/flyTo animation when province is selected
function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 8, {
        animate: true,
        duration: 1.2
      });
    }
  }, [coords, map]);
  return null;
}

interface PricingMapViewProps {
  pricesByProvince: Record<string, any[]>;
  selectedProvince: string | null;
  onSelectProvince: (province: string) => void;
  userLocation?: [number, number] | null;
  className?: string;
}

// Custom style for user marker (pulsing blue/green dot)
const userIcon = typeof window !== 'undefined' ? L.divIcon({
  className: 'custom-user-marker',
  html: '<div style="background-color: #3b82f6; border: 2px solid white; border-radius: 9999px; width: 14px; height: 14px; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
}) : undefined;

export default function PricingMapView({
  pricesByProvince,
  selectedProvince,
  onSelectProvince,
  userLocation,
  className
}: PricingMapViewProps) {
  
  // Calculate map center coordinate
  let centerCoords: [number, number] = [-2.5489, 118.0149]; // Center of Indonesia (default)
  if (selectedProvince && provinceCentroids[selectedProvince]) {
    centerCoords = [provinceCentroids[selectedProvince].lat, provinceCentroids[selectedProvince].lng];
  } else if (userLocation) {
    centerCoords = userLocation;
  }

  // Create styled divIcon for each province marker
  const createProvinceIcon = (provinceName: string, isSelected: boolean) => {
    const letters = provinceName.substring(0, 2).toUpperCase();
    const bgColor = isSelected ? 'var(--gr-orange)' : 'var(--gr-green)';
    const shadowColor = isSelected ? 'rgba(255,155,113,0.5)' : 'rgba(92,255,158,0.5)';
    return L.divIcon({
      className: `prov-marker-${provinceName.replace(/\s+/g, '-')}`,
      html: `
        <div style="
          background-color: ${bgColor}; 
          color: var(--gr-bg); 
          border: 2px solid white; 
          border-radius: 9999px; 
          width: 32px; 
          height: 32px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 10px; 
          font-weight: bold; 
          font-family: sans-serif;
          box-shadow: 0 0 12px ${shadowColor};
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          ${letters}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  return (
    <div className={cn("h-[500px] w-full rounded-3xl overflow-hidden border border-white/5 relative bg-[#07080F]", className)}>
      <MapContainer
        center={centerCoords}
        zoom={selectedProvince ? 8 : 5}
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <MapController coords={selectedProvince ? [provinceCentroids[selectedProvince].lat, provinceCentroids[selectedProvince].lng] : null} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker if available */}
        {userLocation && userIcon && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-sans text-[10px] uppercase font-bold text-center">Lokasi Anda</div>
            </Popup>
          </Marker>
        )}

        {/* Reference prices province markers */}
        {Object.entries(pricesByProvince).map(([provName, list]) => {
          const coords = provinceCentroids[provName];
          if (!coords) return null; // Skip if no centroid coordinate mapped

          const isSelected = selectedProvince === provName;
          const markerIcon = createProvinceIcon(provName, isSelected);

          // Get top 2-3 commodities from this province
          const topList = list.slice(0, 3);

          return (
            <Marker 
              key={provName}
              position={[coords.lat, coords.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectProvince(provName)
              }}
            >
              <Popup>
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
                    onClick={() => onSelectProvince(provName)}
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[9px] font-bold uppercase tracking-wider py-1.5 rounded transition-all"
                  >
                    Lihat Provinsi Ini
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
