'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

interface MapViewProps {
  products: any[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Component to handle map centering
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const MapView: React.FC<MapViewProps> = ({ 
  products, 
  center = [-6.2000, 106.8166], // Jakarta default
  zoom = 13,
  className 
}) => {
  return (
    <div className={cn("h-[600px] w-full rounded-2xl overflow-hidden border border-white/10", className)}>
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
      `}</style>
    </div>
  );
};

export default MapView;
