'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '@/lib/format';
import { currencyOfCurrentOwner } from '@/lib/domain/providers';

export function OwnerEarningsChart({ data = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-stone-50 rounded-2xl text-halo-text-muted text-xs">
        {data.length === 0 ? 'No financial revenue records yet' : 'Rendering chart...'}
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            tickFormatter={(val) => `${currencyOfCurrentOwner()} ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value), currencyOfCurrentOwner()), '']}
            contentStyle={{
              backgroundColor: '#1e293b',
              borderRadius: '0.75rem',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="ownerNet" name="Owner Net (90%)" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="platformFee" name="Platform Fee (10%)" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
