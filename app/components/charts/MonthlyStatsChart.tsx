'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const data = [
  { month: 'Jan', sales: 165, profit: 120 },
  { month: 'Feb', sales: 175, profit: 130 },
  { month: 'Mar', sales: 185, profit: 140 },
  { month: 'Apr', sales: 195, profit: 150 },
  { month: 'May', sales: 205, profit: 160 },
  { month: 'Jun', sales: 215, profit: 170 },
  { month: 'Jul', sales: 225, profit: 180 },
  { month: 'Aug', sales: 220, profit: 175 },
  { month: 'Sep', sales: 230, profit: 185 },
  { month: 'Oct', sales: 240, profit: 195 },
  { month: 'Nov', sales: 235, profit: 190 },
  { month: 'Dec', sales: 250, profit: 200 },
];

export default function MonthlyStatsChart() {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
          <XAxis dataKey="month" stroke="var(--c-text-muted)" fontSize={11} />
          <YAxis stroke="var(--c-text-muted)" fontSize={11} tickFormatter={(v) => `$${v}K`} />
          <Tooltip
            contentStyle={{
              background: 'var(--c-bkg-card)',
              border: '1px solid var(--c-border)',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'var(--c-text-base)' }}
            formatter={(value: number) => [`$${value}K`, '']}
          />
          <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fill="url(#colorSales)" />
          <Area type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorProfit)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
