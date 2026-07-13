'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

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

interface MapViewProps {
  products: any[];
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  radiusKm?: number;
  locationError?: string | null;
  className?: string;
}

// Component to handle map centering
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const MapView: React.FC<MapViewProps> = ({ 
  products, 
  center = [-6.2000, 106.8166], // Jakarta default
  zoom = 13,
  userLocation,
  radiusKm = 10,
  locationError,
  className 
}) => {
  return (
    <div className={cn("h-[600px] w-full rounded-2xl overflow-hidden border border-white/10 relative", className)}>
      {/* Location warning alert banner */}
      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md bg-[#07080F]/90 border border-gr-orange/30 text-gr-text-primary px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest rounded-full shadow-2xl backdrop-blur-md text-center flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gr-orange animate-pulse" />
          <span>{locationError}</span>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
            
            <Circle
              center={userLocation}
              radius={radiusKm * 1000}
              pathOptions={{
                color: 'var(--gr-green)',
                fillColor: 'var(--gr-green)',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '5,5'
              }}
            />
          </>
        )}

        {/* Product Location Markers */}
        {products.map((product) => (
          product.latitude && product.longitude && (
            <Marker 
              key={product.id} 
              position={[product.latitude, product.longitude]}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  {product.photo_url && (
                    <img 
                      src={product.photo_url} 
                      alt={product.name} 
                      className="w-full h-24 object-cover rounded-md mb-2" 
                    />
                  )}
                  <h3 className="font-display text-lg font-medium text-gr-bg m-0">
                    {product.name}
                  </h3>
                  <p className="font-mono text-xs text-gr-green font-bold">
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
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-container {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: #f3ecd7;
          border-radius: 8px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #f3ecd7;
        }
        
        /* Custom User Location Marker Styling */
        .custom-user-marker {
          position: relative;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .user-marker-dot {
          width: 12px;
          height: 12px;
          background-color: var(--gr-green);
          border-radius: 50%;
          border: 2.5px solid #07080F;
          box-shadow: 0 0 10px var(--gr-green);
          z-index: 2;
        }
        .user-marker-pulse {
          position: absolute;
          width: 28px;
          height: 28px;
          background-color: rgba(92, 255, 158, 0.4);
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
