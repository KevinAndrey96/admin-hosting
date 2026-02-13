'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CircularProgressProps {
  percent: number;
  color: string;
  label: string;
}

export default function CircularProgress({ percent, color, label }: CircularProgressProps) {
  const data = [
    { value: percent, fill: color },
    { value: 100 - percent, fill: 'var(--c-border-light)' },
  ];

  return (
    <div className="peer" style={{ textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={38}
              startAngle={90}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={data[0].fill} />
              <Cell fill={data[1].fill} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <h6 className="fsz-sm mB-0 mT-10">{label}</h6>
    </div>
  );
}
