'use client';

import GraficoVendas from "@/components/Graficos/GraficoVendas";
import GraficoCategorias from "@/components/Graficos/GraficoCategorias";
import SummaryCard from "@/components/SummaryCard/SummaryCard";
import { useApp } from "@/providers/AppProvider";
import { formatCurrency } from "@/utils/currency";

export default function Home() {
  const { produtos, vendas, contasReceber, contasPagar } = useApp();

  const totalEstoque = produtos.reduce((s, p) => s + (Number(p.estoque) || 0), 0);
  const totalVendas = vendas.reduce((s, v) => s + (Number(v.total) || 0), 0);
  const totalReceber = contasReceber.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const totalPagar = contasPagar.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const fluxo = totalReceber - totalPagar;

  const cards = [
    { titulo: "Produtos em estoque", valor: `${totalEstoque} unidades`, descricao: `${produtos.length} SKUs`, destaque: false },
    { titulo: "Total em vendas", valor: formatCurrency(totalVendas), descricao: `${vendas.length} vendas`, destaque: false },
    { titulo: "Fluxo de caixa", valor: formatCurrency(fluxo), descricao: fluxo >= 0 ? "Positivo" : "Negativo", destaque: fluxo >= 0 },
    { titulo: "Contas a receber", valor: formatCurrency(totalReceber), descricao: `${contasReceber.length} lancamentos`, destaque: false },
  ];

  return (
    <div className="flex flex-col">
      <div className="p-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-1">Dashboard</h1>
        <p className="text-gray-600 text-sm">Visao geral do sistema</p>
      </div>

      <div className="flex-1 p-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map((card, idx) => (
            <SummaryCard key={idx} titulo={card.titulo} valor={card.valor} descricao={card.descricao} destaque={card.destaque} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Vendas</h3>
            <GraficoVendas vendasData={vendas} />
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Produtos por categoria</h3>
            <GraficoCategorias produtosData={produtos} />
          </div>
        </div>
      </div>
    </div>
  );
}
