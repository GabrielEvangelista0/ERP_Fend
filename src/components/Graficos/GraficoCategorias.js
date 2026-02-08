'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f472b6'];

const GraficoCategorias = ({ produtosData = null }) => {
  const data = useMemo(() => {
    if (!produtosData || produtosData.length === 0) {
      return [
        { name: 'Eletrônicos', value: 35, color: '#3b82f6' },
        { name: 'Roupas', value: 25, color: '#10b981' },
        { name: 'Alimentos', value: 20, color: '#f59e0b' },
        { name: 'Móveis', value: 12, color: '#8b5cf6' },
        { name: 'Outros', value: 8, color: '#ef4444' },
      ];
    }

    const map = {};
    produtosData.forEach((p) => {
      const cat = p.categoria || 'Outros';
      const estoque = Number(p.estoque) || 0;
      map[cat] = (map[cat] || 0) + estoque;
    });

    const entries = Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }));

    // sort desc by value
    entries.sort((a, b) => b.value - a.value);
    return entries;
  }, [produtosData]);

  const COLORS = data.map((item, i) => item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value}`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GraficoCategorias;
