'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f472b6'];

const GraficoCategorias = ({ produtosData = null }) => {
  const data = useMemo(() => {
    if (!produtosData || produtosData.length === 0) {
      return [
        { name: 'Eletrônicos', value: 35 },
        { name: 'Roupas', value: 25 },
        { name: 'Alimentos', value: 20 },
        { name: 'Móveis', value: 12 },
        { name: 'Outros', value: 8 },
      ];
    }

    const map = {};
    produtosData.forEach((p) => {
      const cat = p.categoria || 'Outros';
      const estoque = Number(p.estoque) || 0;
      map[cat] = (map[cat] || 0) + estoque;
    });

    const entries = Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));

    // sort desc by value
    entries.sort((a, b) => b.value - a.value);
    return entries;
  }, [produtosData]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Estoque" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GraficoCategorias;
