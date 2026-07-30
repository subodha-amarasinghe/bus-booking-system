'use client';

import type { RouteCoordinate } from '@bus-booking/shared-types';
import { useEffect, useRef } from 'react';

export function RouteMap({
  coordinates,
  className = 'h-[420px]',
}: {
  coordinates: RouteCoordinate[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let map: import('leaflet').Map | undefined;

    void import('leaflet').then((leaflet) => {
      if (disposed || !containerRef.current) return;
      map = leaflet.map(containerRef.current, {
        attributionControl: true,
        scrollWheelZoom: false,
      });
      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })
        .addTo(map);

      if (coordinates.length > 1) {
        const points = coordinates.map(
          ({ lat, lng }) => [lat, lng] as [number, number],
        );
        leaflet
          .polyline(points, {
            color: '#2563eb',
            opacity: 0.9,
            weight: 6,
          })
          .addTo(map);
        leaflet
          .circleMarker(points[0], {
            color: '#fff',
            fillColor: '#16a34a',
            fillOpacity: 1,
            radius: 8,
            weight: 3,
          })
          .addTo(map);
        leaflet
          .circleMarker(points[points.length - 1], {
            color: '#fff',
            fillColor: '#dc2626',
            fillOpacity: 1,
            radius: 8,
            weight: 3,
          })
          .addTo(map);
        map.fitBounds(points, { padding: [28, 28] });
      } else {
        map.setView([7.8731, 80.7718], 7);
      }
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [coordinates]);

  return (
    <div
      aria-label="Street map showing the selected bus route"
      className={`${className} z-0 w-full overflow-hidden rounded-2xl bg-slate-100`}
      ref={containerRef}
      role="img"
    />
  );
}
