'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const SPARKLINE_CONFIGS = [
  { id: 'sparklinedash', data: [0, 5, 6, 10, 9, 12, 4, 9], color: '#4caf50' },
  { id: 'sparklinedash2', data: [0, 5, 6, 10, 9, 12, 4, 9], color: '#9675ce' },
  { id: 'sparklinedash3', data: [0, 5, 6, 10, 9, 12, 4, 9], color: '#03a9f3' },
  { id: 'sparklinedash4', data: [0, 5, 6, 10, 9, 12, 4, 9], color: '#f96262' },
];

export default function AdminatorCharts() {
  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    SPARKLINE_CONFIGS.forEach((config) => {
      const el = document.getElementById(config.id);
      if (!el) return;

      let canvas = el as HTMLCanvasElement;
      if (el.tagName !== 'CANVAS') {
        const parent = el.parentNode;
        if (!parent) return;
        const newCanvas = document.createElement('canvas');
        newCanvas.id = config.id;
        newCanvas.width = 100;
        newCanvas.height = 20;
        newCanvas.style.width = '100px';
        newCanvas.style.height = '20px';
        parent.replaceChild(newCanvas, el);
        canvas = newCanvas;
      } else {
        canvas.width = 100;
        canvas.height = 20;
        canvas.style.width = '100px';
        canvas.style.height = '20px';
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: config.data.map((_, i) => i),
          datasets: [{
            data: config.data,
            backgroundColor: config.color,
            borderColor: config.color,
            borderWidth: 0,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          }],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          events: [],
          scales: {
            x: { display: false },
            y: { display: false },
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          elements: { bar: { borderRadius: 1 } },
        },
      });

      chartsRef.current.push(chart);
    });

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, []);

  return null;
}
