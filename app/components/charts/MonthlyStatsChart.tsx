'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface MonthlyIncomeData {
  month: string;
  monthNum: number;
  income: number;
}

export interface MonthlyIncomeResponse {
  year: number;
  currency: string;
  data: MonthlyIncomeData[];
  total: number;
  bestMonth: { month: string; value: number } | null;
  worstMonth: { month: string; value: number } | null;
  average: number;
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShort(value: number, currency: string) {
  const sym = currency === 'COP' ? '$' : currency === 'USD' ? 'US$' : '';
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value, currency);
}

interface MonthlyStatsChartProps {
  data: MonthlyIncomeData[];
  currency: string;
  height?: number;
}

export default function MonthlyStatsChart({ data, currency, height = 220 }: MonthlyStatsChartProps) {
  const chartData = data.length ? data : MONTH_LABELS.map((month, i) => ({ month, monthNum: i + 1, income: 0 }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
          <XAxis dataKey="month" stroke="var(--c-text-muted)" fontSize={11} />
          <YAxis
            stroke="var(--c-text-muted)"
            fontSize={11}
            tickFormatter={(v) => formatShort(v, currency)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--c-bkg-card)',
              border: '1px solid var(--c-border)',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'var(--c-text-base)' }}
            formatter={(value: number) => [formatCurrency(value, currency), 'Ingreso']}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorIncome)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
