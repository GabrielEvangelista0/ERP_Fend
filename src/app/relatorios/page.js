'use client';

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from "@/components/SummaryCard/SummaryCard";
import { useApp } from "@/providers/AppProvider";
import { formatCurrency } from "@/utils/currency";

function exportCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function Page() {
  const { vendas, produtos, contasReceber, contasPagar, clientes, compras } = useApp();
  const [tab, setTab] = useState("performance");

  // Análise de Performance
  const topClientes = useMemo(() => {
    const map = {};
    vendas.forEach((v) => {
      const cliente = v.cliente;
      if (!map[cliente]) map[cliente] = { cliente, vendas: 0, total: 0 };
      map[cliente].vendas += 1;
      map[cliente].total += Number(v.total) || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [vendas]);

  // Análise de Estoque
  const estoqueCritico = useMemo(() => {
    const media = produtos.length > 0 ? produtos.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0) / produtos.length : 0;
    return produtos
      .filter((p) => (Number(p.estoque) || 0) < media * 0.5)
      .sort((a, b) => (Number(a.estoque) || 0) - (Number(b.estoque) || 0))
      .slice(0, 10);
  }, [produtos]);

  const valorEstoque = useMemo(() => {
    return produtos.reduce((acc, p) => {
      const preco = Number(String(p.preco || "0").replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
      const estoque = Number(p.estoque) || 0;
      return acc + preco * estoque;
    }, 0);
  }, [produtos]);

  // Análise Financeira
  const receitas = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const custos = compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const lucroBruto = receitas - custos;
  const margem = receitas > 0 ? ((lucroBruto / receitas) * 100).toFixed(2) : 0;
  
  const totalReceber = useMemo(() => contasReceber
    .filter((c) => (c.status || "").toLowerCase() === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0), [contasReceber]);
  const totalPagar = useMemo(() => contasPagar
    .filter((c) => (c.status || "").toLowerCase() === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0), [contasPagar]);
  const fluxoCaixa = totalReceber - totalPagar;

  const analises = [
    { id: "performance", nome: "Relatorio de Vendas" },
    { id: "estoque", nome: "Relatorio de Estoque" },
    { id: "financeiro", nome: "Relatorio Financeiro" },
  ];

  const getRowsData = () => {
    if (tab === "performance") {
      return [
        ["Posição", "Cliente", "Total de Vendas", "Quantidade", "Ticket Médio"],
        ...topClientes.map((c, idx) => [
          idx + 1,
          c.cliente,
          formatCurrency(c.total),
          c.vendas,
          formatCurrency(c.total / c.vendas)
        ])
      ];
    } else if (tab === "estoque") {
      return [
        ["Nome", "Categoria", "Preço", "Estoque", "Status"],
        ...estoqueCritico.map((p) => {
          const preco = String(p.preco || "0").replace(/[^\d,.-]/g, "").replace(",", ".");
          return [p.nome, p.categoria, p.preco, p.estoque, "Crítico"];
        })
      ];
    } else if (tab === "financeiro") {
      return [
        ["Indicador", "Valor", "Status"],
        ["Contas a Receber", formatCurrency(totalReceber), contasReceber.filter((c) => (c.status || "").toLowerCase() === "pendente").length + " pendente(s)"],
        ["Contas a Pagar", formatCurrency(totalPagar), contasPagar.filter((c) => (c.status || "").toLowerCase() === "pendente").length + " pendente(s)"],
        ["Fluxo de Caixa", formatCurrency(fluxoCaixa), fluxoCaixa >= 0 ? "Positivo" : "Negativo"],
        ["Saldo Líquido", formatCurrency(fluxoCaixa), fluxoCaixa >= 0 ? "Saudável" : "Crítico"],
      ];
    }
    return [];
  };

  const rows = getRowsData();

  const summaryCards = tab === "performance"
    ? [
        { titulo: "Top Cliente", valor: topClientes[0]?.cliente || "N/A", descricao: formatCurrency(topClientes[0]?.total || 0), destaque: true },
        { titulo: "Total de Vendas", valor: vendas.length.toString(), descricao: formatCurrency(vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0)), destaque: false },
        { titulo: "Ticket Médio", valor: formatCurrency(vendas.length > 0 ? vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0) / vendas.length : 0), descricao: `${vendas.length} vendas`, destaque: true },
      ]
    : tab === "estoque"
      ? [
          { titulo: "Produtos Críticos", valor: estoqueCritico.length.toString(), descricao: `${parseInt((estoqueCritico.length / produtos.length) * 100)}% do catálogo`, destaque: estoqueCritico.length > 0 },
          { titulo: "Valor Total", valor: formatCurrency(valorEstoque), descricao: `${produtos.length} produtos`, destaque: false },
          { titulo: "Estoque Médio", valor: `${Math.round(produtos.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0) / produtos.length)} un.`, descricao: "Por produto", destaque: false },
        ]
      : tab === "financeiro"
        ? [
            { titulo: "Faturamento", valor: formatCurrency(receitas), descricao: `${vendas.length} vendas`, destaque: true },
            { titulo: "Lucro Bruto", valor: formatCurrency(lucroBruto), descricao: "Receitas - Custos", destaque: lucroBruto >= 0 },
            { titulo: "Margem de Lucro", valor: `${margem}%`, descricao: "Do faturamento total", destaque: margem > 0 },
            { titulo: "Fluxo de Caixa", valor: formatCurrency(fluxoCaixa), descricao: "Receber - Pagar", destaque: fluxoCaixa >= 0 },
            { titulo: "Total a Receber", valor: formatCurrency(totalReceber), descricao: `${contasReceber.filter((c) => (c.status || "").toLowerCase() === "pendente").length} pendente(s)`, destaque: false },
            { titulo: "Total a Pagar", valor: formatCurrency(totalPagar), descricao: `${contasPagar.filter((c) => (c.status || "").toLowerCase() === "pendente").length} pendente(s)`, destaque: false },
          ]
        : [];

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      <PageHeader titulo="Relatorios" descricao="Vendas, estoque e financeiro com análises de dados" />
      <div className="flex-1 p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {analises.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`p-4 rounded-lg border-2 text-left text-[#001A23] cursor-pointer hover:bg-[#001A23] hover:text-[#E0F2F1] ${tab === item.id ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"}`}
            >
              <h3 className="font-bold">{item.nome}</h3>
            </button>
          ))}
          <button onClick={() => exportCsv(`relatorio-${tab}.csv`, rows)} className="p-4 rounded-lg border-2 cursor-pointer bg-[#001A23] text-[#E0F2F1] font-semibold hover:bg-[#002F3A] transition-colors">
            Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {summaryCards.map((card, idx) => (
            <SummaryCard key={idx} titulo={card.titulo} valor={card.valor} descricao={card.descricao} destaque={card.destaque} />
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {rows[0].map((h) => (
                  <th key={h} className="p-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, idx) => (
                <tr key={idx} className="border-t">
                  {row.map((cell, cidx) => (
                    <td key={`${idx}-${cidx}`} className="p-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
