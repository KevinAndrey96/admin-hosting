'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import 'jsvectormap/dist/jsvectormap.css';

// Dynamic imports for client-only (jsvectormap uses window)
const loadJsVectorMap = () =>
  import('jsvectormap').then((m) => m.default);
const loadWorldMap = () => import('jsvectormap/dist/maps/world.js');

function getThemeColors(isDark: boolean) {
  return {
    backgroundColor: isDark ? '#313644' : '#f9fafb',
    regionColor: isDark ? '#565a5c' : '#e6eaf0',
    borderColor: isDark ? '#72777a' : '#d3d9e3',
    hoverColor: isDark ? '#7774e7' : '#0f9aee',
    selectedColor: isDark ? '#37c936' : '#7774e7',
    markerFill: isDark ? '#0f9aee' : '#7774e7',
    markerStroke: isDark ? '#37c936' : '#0f9aee',
  };
}

export default function WorldMapChart() {
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
        await loadWorldMap(); // Registers 'world' map - must run after jsVectorMap loads
        if (!mounted || !container) return;

        // Remove previous map SVG if any
        const existing = container.querySelector('.jvectormap-container');
        if (existing) existing.remove();

        const isDark = theme === 'dark';
        const colors = getThemeColors(isDark);

        const mapContainer = document.createElement('div');
        mapContainer.id = 'world-map-site-visits';
        mapContainer.style.height = '300px';
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.borderRadius = '8px';
        container.appendChild(mapContainer);

        const instance = jsVectorMap({
          selector: '#world-map-site-visits',
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
              r: 6,
              fill: colors.markerFill,
              stroke: colors.markerStroke,
              'stroke-width': 2,
              'stroke-opacity': 0.4,
            },
            hover: {
              r: 8,
              fill: colors.hoverColor,
              'stroke-opacity': 0.8,
              cursor: 'pointer',
            },
          },
          markers: [
            { name: 'USA: 100k', coords: [37.09, -95.71] },
            { name: 'Europe: 1M', coords: [50.45, 9.16] },
            { name: 'Australia: 450k', coords: [-25.27, 133.77] },
            { name: 'India: 1B', coords: [20.59, 78.96] },
          ],
          zoomOnScroll: false,
          zoomButtons: false,
          onMarkerTooltipShow(_event: unknown, tooltip: { text: (t: string) => void }, index: number) {
            const markers = [
              { name: 'USA: 100k' },
              { name: 'Europe: 1M' },
              { name: 'Australia: 450k' },
              { name: 'India: 1B' },
            ];
            tooltip.text(markers[index]?.name ?? '');
          },
        });

        mapInstanceRef.current = instance as unknown as { destroy: () => void };
        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar el mapa');
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
      const mapEl = container.querySelector('#world-map-site-visits');
      if (mapEl) mapEl.remove();
    };
  }, [theme]);

  if (error) {
    return (
      <div
        className="d-f ai-c jc-c"
        style={{
          minHeight: 300,
          background: 'var(--c-bkg-hover)',
          borderRadius: 8,
          color: 'var(--c-text-muted)',
        }}
      >
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', minHeight: 300 }}
      className="world-map-chart"
    />
  );
}
