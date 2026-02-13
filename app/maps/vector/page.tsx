'use client';

import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useTheme } from '../../hooks/useTheme';
import 'jsvectormap/dist/jsvectormap.css';

const loadJsVectorMap = () => import('jsvectormap').then((m) => m.default);
const loadWorldMap = () => import('jsvectormap/dist/maps/world.js');

function getThemeColors(isDark: boolean) {
  return {
    regionColor: isDark ? '#565a5c' : '#e6eaf0',
    borderColor: isDark ? '#72777a' : '#d3d9e3',
    hoverColor: isDark ? '#7774e7' : '#0f9aee',
    selectedColor: isDark ? '#37c936' : '#7774e7',
    markerFill: isDark ? '#0f9aee' : '#7774e7',
    markerStroke: isDark ? '#37c936' : '#0f9aee',
  };
}

export default function VectorMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ destroy: () => void } | null>(null);
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mounted = true;

    const initMap = async () => {
      try {
        const jsVectorMap = await loadJsVectorMap();
        await loadWorldMap();
        if (!mounted || !container) return;

        const existing = container.querySelector('.jvectormap-container');
        if (existing) existing.remove();

        const isDark = theme === 'dark';
        const colors = getThemeColors(isDark);

        const mapContainer = document.createElement('div');
        mapContainer.id = 'vector-map-page';
        mapContainer.style.height = '500px';
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.borderRadius = '8px';
        mapContainer.style.border = `1px solid ${colors.borderColor}`;
        container.appendChild(mapContainer);

        const instance = jsVectorMap({
          selector: '#vector-map-page',
          map: 'world',
          backgroundColor: 'transparent',
          regionStyle: {
            initial: {
              fill: colors.regionColor,
              stroke: colors.borderColor,
              'stroke-width': 1,
              'stroke-opacity': 0.4,
            },
            hover: {
              fill: colors.hoverColor,
              cursor: 'pointer',
            },
            selected: {
              fill: colors.selectedColor,
            },
          },
          markerStyle: {
            initial: {
              r: 7,
              fill: colors.markerFill,
              stroke: colors.markerStroke,
              'stroke-width': 2,
              'stroke-opacity': 0.4,
            },
            hover: {
              r: 10,
              fill: colors.hoverColor,
              'stroke-opacity': 0.8,
              cursor: 'pointer',
            },
          },
          markers: [
            { name: 'India: 350', coords: [21.0, 78.0] },
            { name: 'Australia: 250', coords: [-33.0, 151.0] },
            { name: 'USA: 250', coords: [36.77, -119.41] },
            { name: 'UK: 250', coords: [55.37, -3.41] },
            { name: 'Brazil: 180', coords: [-14.23, -51.93] },
            { name: 'Japan: 200', coords: [36.2, 138.25] },
          ],
          zoomOnScroll: true,
          zoomButtons: true,
          onMarkerTooltipShow(
            _event: unknown,
            tooltip: { text: (t: string) => void },
            index: number
          ) {
            const names = [
              'India: 350',
              'Australia: 250',
              'USA: 250',
              'UK: 250',
              'Brazil: 180',
              'Japan: 200',
            ];
            tooltip.text(names[index] ?? '');
          },
        });

        mapInstanceRef.current = instance as unknown as { destroy: () => void };
        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error loading map');
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      const instance = mapInstanceRef.current;
      if (instance) {
        try {
          instance.destroy();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      const mapEl = container.querySelector('#vector-map-page');
      if (mapEl) mapEl.remove();
    };
  }, [theme]);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Vector Maps</h4>
          </div>
        </div>

        <div className="bd bgc-white p-20">
          <h5 className="mB-20">Bootstrap Vector Map</h5>

          {error && (
            <div
              className="d-f ai-c jc-c"
              style={{
                minHeight: 400,
                background: 'var(--c-bkg-hover)',
                borderRadius: 8,
                color: 'var(--c-text-muted)',
              }}
            >
              <span>{error}</span>
            </div>
          )}

          {!error && (
            <div
              ref={containerRef}
              style={{ width: '100%', minHeight: 500 }}
              className="vector-map-container"
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
