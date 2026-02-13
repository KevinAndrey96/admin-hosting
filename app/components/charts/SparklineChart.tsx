'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const generateData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: String(i),
    value: Math.floor(Math.random() * 12) + 1,
  }));
};

interface SparklineChartProps {
  color?: string;
  data?: { name?: string; value: number }[];
}

export default function SparklineChart({ color = '#10b981', data }: SparklineChartProps) {
  const chartData = data?.length
    ? data.map((d, i) => ({ name: String(i), value: d.value }))
    : generateData(8);

  return (
    <div style={{ width: '100%', height: 40, minWidth: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" hide />
          <YAxis hide domain={[0, 'auto']} />
          <Bar
            dataKey="value"
            fill={color}
            radius={[2, 2, 0, 0]}
            barSize={8}
            maxBarSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
