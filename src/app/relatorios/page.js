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
  const { vendas, produtos, contasReceber, contasPagar } = useApp();
  const [tab, setTab] = useState("vendas");

  const totalVendas = useMemo(() => vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0), [vendas]);
  const totalEstoque = useMemo(() => produtos.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0), [produtos]);
  const totalReceber = useMemo(() => contasReceber.reduce((acc, c) => acc + (Number(c.valor) || 0), 0), [contasReceber]);
  const totalPagar = useMemo(() => contasPagar.reduce((acc, c) => acc + (Number(c.valor) || 0), 0), [contasPagar]);

  const relatorios = [
    { id: "vendas", nome: "Relatorio de Vendas" },
    { id: "estoque", nome: "Relatorio de Estoque" },
    { id: "financeiro", nome: "Relatorio Financeiro" },
  ];

  const rows = tab === "vendas"
    ? [["ID", "Data", "Cliente", "Itens", "Total"], ...vendas.map((v) => [v.id, v.data, v.cliente, v.items, v.total])]
    : tab === "estoque"
      ? [["ID", "Nome", "Categoria", "Preco", "Estoque"], ...produtos.map((p) => [p.id, p.nome, p.categoria, p.preco, p.estoque])]
      : [["Tipo", "ID", "Descricao", "Valor", "Vencimento", "Status"],
        ...contasReceber.map((c) => ["Receber", c.id, c.descricao, c.valor, c.vencimento, c.status]),
        ...contasPagar.map((c) => ["Pagar", c.id, c.descricao, c.valor, c.vencimento, c.status])];

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      <PageHeader titulo="Relatorios" descricao="Vendas, estoque e financeiro com exportacao CSV" />
      <div className="flex-1 p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {relatorios.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`p-4 rounded-lg border-2 text-left ${tab === item.id ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"}`}
            >
              <h3 className="font-bold text-black">{item.nome}</h3>
            </button>
          ))}
          <button onClick={() => exportCsv(`relatorio-${tab}.csv`, rows)} className="p-4 rounded-lg border-2 border-emerald-700 bg-emerald-50 text-emerald-900 font-semibold">
            Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryCard titulo="Total vendas" valor={formatCurrency(totalVendas)} descricao={`${vendas.length} vendas`} destaque={true} />
          <SummaryCard titulo="Total estoque" valor={`${totalEstoque} un.`} descricao={`${produtos.length} produtos`} destaque={false} />
          <SummaryCard titulo="Fluxo liquido" valor={formatCurrency(totalReceber - totalPagar)} descricao="Receber - Pagar" destaque={totalReceber >= totalPagar} />
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
