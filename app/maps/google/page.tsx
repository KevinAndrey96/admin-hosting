'use client';

import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => unknown;
        Marker: new (opts: object) => unknown;
      };
    };
    initGoogleMap?: () => void;
  }
}

export default function GoogleMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file');
      setLoading(false);
      return;
    }

    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.006 },
          zoom: 10,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'landscape', stylers: [{ hue: '#FFBB00' }] },
            { featureType: 'road.highway', stylers: [{ hue: '#FFC200' }] },
            { featureType: 'road.arterial', stylers: [{ hue: '#FF0300' }] },
            { featureType: 'water', stylers: [{ hue: '#0078FF' }] },
            { featureType: 'poi', stylers: [{ hue: '#00FF6A' }] },
          ],
        });

        new window.google.maps.Marker({
          position: { lat: 40.7128, lng: -74.006 },
          map,
          title: 'New York',
        });

        mapInstanceRef.current = map;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setLoading(false);
      }
    };

    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;

    window.initGoogleMap = () => {
      initMap();
      delete window.initGoogleMap;
    };

    script.onerror = () => {
      setError('Failed to load Google Maps script');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      mapInstanceRef.current = null;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [apiKey]);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Google Maps</h4>
          </div>
        </div>

        <div className="bd bgc-white p-20">
          <h5 className="mB-20">Google Maps</h5>

          {error && (
            <div
              className="alert alert-warning d-f ai-c gap-10"
              style={{ minHeight: 400 }}
            >
              <div>
                <strong>Configuration required</strong>
                <p className="mB-0 mT-5 c-grey-600">
                  {error}
                </p>
                <p className="mT-10 fsz-sm">
                  Get an API key from{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                    Google Cloud Console
                  </a>
                  , enable Maps JavaScript API, and add to <code>.env.local</code>:
                </p>
                <code className="d-b p-10 bgc-grey-100 bdrs-5 mT-10">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
                </code>
              </div>
            </div>
          )}

          {!error && (
            <div className="pos-r" style={{ minHeight: 450, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--c-border)' }}>
              {loading && (
                <div
                  className="pos-a t-0 l-0 r-0 b-0 d-f ai-c jc-c"
                  style={{ background: 'var(--c-bkg-hover)', zIndex: 1 }}
                >
                  <span className="c-grey-600">Loading map...</span>
                </div>
              )}
              <div ref={mapRef} style={{ width: '100%', height: 450 }} />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
