'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPinned } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { passengerApi } from '../../lib/passenger-api';

export function RouteMapCard({ routeId }: { routeId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const routeQuery = useQuery({
    queryKey: ['passenger-route', routeId],
    queryFn: () => passengerApi.getRoute(routeId),
  });
  const coordinates = routeQuery.data?.pathCoordinates ?? [];

  useEffect(() => {
    if (!containerRef.current || coordinates.length < 2) return;
    let disposed = false;
    let map: import('leaflet').Map | undefined;

    void import('leaflet').then((leaflet) => {
      if (disposed || !containerRef.current) return;
      const points = coordinates.map(
        ({ lat, lng }) => [lat, lng] as [number, number],
      );
      map = leaflet.map(containerRef.current, { scrollWheelZoom: false });
      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })
        .addTo(map);
      leaflet
        .polyline(points, { color: '#2563eb', opacity: 0.9, weight: 6 })
        .addTo(map);
      leaflet
        .circleMarker(points[0], {
          color: '#fff',
          fillColor: '#16a34a',
          fillOpacity: 1,
          radius: 7,
          weight: 3,
        })
        .addTo(map);
      leaflet
        .circleMarker(points[points.length - 1], {
          color: '#fff',
          fillColor: '#dc2626',
          fillOpacity: 1,
          radius: 7,
          weight: 3,
        })
        .addTo(map);
      map.fitBounds(points, { padding: [24, 24] });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [coordinates]);

  if (routeQuery.isPending) {
    return <div className="ui-card h-32 animate-pulse bg-slate-100" />;
  }
  if (!routeQuery.data || coordinates.length < 2) return null;

  const route = routeQuery.data;
  return (
    <section className="ui-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <MapPinned className="h-4 w-4" aria-hidden />
            Route {route.routeNumber ?? ''}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">
            {route.name}
          </h2>
        </div>
        <p className="shrink-0 text-right text-xs font-medium text-slate-500">
          {route.distanceKm != null ? `${route.distanceKm} km` : ''}
          {route.estimatedDurationMin != null
            ? ` · ~${route.estimatedDurationMin} min`
            : ''}
        </p>
      </div>
      <div
        aria-label={`Street map for ${route.name}`}
        className="z-0 h-64 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-80"
        ref={containerRef}
        role="img"
      />
    </section>
  );
}
