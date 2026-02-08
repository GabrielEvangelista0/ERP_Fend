'use client';

import { Package, TrendingUp, DollarSign } from "lucide-react";
import GraficoVendas from '@/components/Graficos/GraficoVendas';
import GraficoCategorias from '@/components/Graficos/GraficoCategorias';
import SummaryCard from '@/components/SummaryCard/SummaryCard';
import { produtos } from '@/data/produtos';
import { vendas } from '@/data/vendas';
import { contasReceber, contasPagar } from '@/data/financeiro';
import { formatCurrency } from '@/utils/currency';

export default function Home() {
  // calcular dinamicamente os quatro cards requisitados
  const totalEstoque = produtos.reduce((s, p) => s + (Number(p.estoque) || 0), 0);
  const totalVendas = vendas.reduce((s, v) => s + (Number(v.total) || 0), 0);
  const totalReceber = contasReceber.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const totalPagar = contasPagar.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const fluxo = totalVendas + totalReceber - totalPagar; // aproximação de fluxo

  const cards = [
    { titulo: 'Produtos em Estoque', valor: `${totalEstoque} unidades`, descricao: `${produtos.length} SKUs`, destaque: false },
    { titulo: 'Total em Vendas', valor: formatCurrency(totalVendas), descricao: `${vendas.length} vendas`, destaque: false },
    { titulo: 'Fluxo de Caixa', valor: formatCurrency(fluxo), descricao: 'Estimativa', destaque: fluxo >= 0 },
    { titulo: 'Contas a Receber', valor: formatCurrency(totalReceber), descricao: `${contasReceber.length} pendente(s)`, destaque: false },
  ];

  return (
    <div className="flex flex-col">
      {/* Header da página */}
      <div className="p-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-1">Dashboard</h1>
        <p className="text-gray-600 text-sm">Visão geral do sistema</p>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-8">
        {/* Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map((card, idx) => (
            <SummaryCard key={idx} titulo={card.titulo} valor={card.valor} descricao={card.descricao} destaque={card.destaque} />
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Vendas</h3>
            <GraficoVendas vendasData={vendas} />
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Produtos por categorias</h3>
            <GraficoCategorias produtosData={produtos} />
          </div>
        </div>
      </div>
    </div>
  );
}
