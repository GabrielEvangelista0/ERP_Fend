'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const parseMonthIndex = (dateStr) => {
  if (!dateStr) return null;
  // suportar formatos 'DD/MM/YYYY' e 'YYYY-MM-DD' e outros
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length >= 2) return Number(parts[1]) - 1;
  }
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) return Number(parts[1]) - 1;
  }
  return null;
};

const GraficoVendas = ({ vendasData = null }) => {
  const data = useMemo(() => {
    if (!vendasData || vendasData.length === 0) {
      return MONTHS.map((m, i) => ({ mes: m, vendas: 0, alvo: 0 }));
    }

    const totals = new Array(12).fill(0);
    vendasData.forEach((v) => {
      const idx = parseMonthIndex(v.data);
      const total = Number(v.total) || 0;
      if (idx !== null && idx >= 0 && idx < 12) totals[idx] += total;
    });

    return totals.map((val, i) => ({ mes: MONTHS[i], vendas: Number(val.toFixed(2)), alvo: Number((val * 1.1).toFixed(2)) }));
  }, [vendasData]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip
          formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
        />
        <Legend />
        <Line type="monotone" dataKey="vendas" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Vendas Reais" />
        <Line type="monotone" dataKey="alvo" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Meta" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default GraficoVendas;
