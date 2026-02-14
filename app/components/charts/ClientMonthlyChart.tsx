'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface ClientMonthlyData {
  month: string;
  monthNum: number;
  hosting: number;
  domain: number;
}

interface ClientMonthlyChartProps {
  data: ClientMonthlyData[];
  height?: number;
}

export default function ClientMonthlyChart({ data, height = 340 }: ClientMonthlyChartProps) {
  const chartData = data.length ? data : MONTH_LABELS.map((month, i) => ({ month, monthNum: i + 1, hosting: 0, domain: 0 }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
          <XAxis dataKey="month" stroke="var(--c-text-muted)" fontSize={11} />
          <YAxis stroke="var(--c-text-muted)" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--c-bkg-card)',
              border: '1px solid var(--c-border)',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'var(--c-text-base)' }}
            formatter={(value: number, name: string) => [value, name === 'hosting' ? 'Hosting' : 'Dominios']}
            labelFormatter={(label) => `Mes: ${label}`}
          />
          <Legend
            formatter={(value) => (value === 'hosting' ? 'Hosting vencen' : 'Dominios vencen')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="hosting"
            name="hosting"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="domain"
            name="domain"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
