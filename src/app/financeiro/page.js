'use client';

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import SummaryCard from "@/components/SummaryCard/SummaryCard";
import { formatCurrency } from "@/utils/currency";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
  const { contasReceber, contasPagar, setContasReceber, setContasPagar, upsertFinanceiro, canEdit } = useApp();
  const [filtro, setFiltro] = useState("receber");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const dadosBase = filtro === "receber" ? contasReceber : contasPagar;
  const dados = dadosBase.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(item).some((v) => String(v).toLowerCase().includes(q));
  });

  const resumo = useMemo(() => {
    const totalReceber = contasReceber.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const totalPagar = contasPagar.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const pendentesReceber = contasReceber.filter((d) => (d.status || "").toLowerCase() === "pendente").length;
    const pendentesPagar = contasPagar.filter((d) => (d.status || "").toLowerCase() === "pendente").length;
    const fluxo = totalReceber - totalPagar;

    return [
      { titulo: "Contas a pagar", valor: formatCurrency(totalPagar), descricao: `${pendentesPagar} pendente(s)`, destaque: false },
      { titulo: "Fluxo de caixa", valor: formatCurrency(fluxo), descricao: fluxo >= 0 ? "Positivo" : "Negativo", destaque: fluxo >= 0 },
      { titulo: "Contas a receber", valor: formatCurrency(totalReceber), descricao: `${pendentesReceber} pendente(s)`, destaque: false },
    ];
  }, [contasReceber, contasPagar]);

  return (
    <div className="flex-1 min-h-screen">
      <PageHeader titulo="Financeiro" descricao="Gestao financeira e fluxo de caixa" />

      <div className="grid grid-cols-3 gap-4 px-8 py-6">
        {resumo.map((card, idx) => (
          <SummaryCard key={idx} titulo={card.titulo} valor={card.valor} descricao={card.descricao} destaque={card.destaque} />
        ))}
      </div>

      <div className="px-8 py-4 flex items-center gap-3 justify-center flex-wrap">
        <button
          onClick={() => setFiltro("pagar")}
          className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${filtro === "pagar" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
        >
          Contas a pagar
        </button>
        <button
          onClick={() => setFiltro("receber")}
          className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${filtro === "receber" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
        >
          Contas a receber
        </button>
        {canEdit("financeiro") ? (
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 font-medium whitespace-nowrap ml-auto">
            + nova conta
          </button>
        ) : null}
      </div>

      <div className="p-8 bg-white mx-8 rounded-lg border border-gray-200">
        <SearchBar value={query} onChange={setQuery} placeholder={filtro === "receber" ? "Buscar contas a receber" : "Buscar contas a pagar"} />
        <TabelaDados
          dados={dados}
          tipo="financeiro"
          onStatusChange={(item) => {
            if (filtro === "receber") {
              setContasReceber((prev) => prev.map((p) => (p.id === item.id ? item : p)));
            } else {
              setContasPagar((prev) => prev.map((p) => (p.id === item.id ? item : p)));
            }
          }}
          onEdit={canEdit("financeiro") ? (item) => { setEditing({ ...item, tipoConta: item.clienteId ? "receber" : "pagar" }); setModalOpen(true); } : undefined}
        />
      </div>

      <CreateEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo="financeiro"
        initial={editing}
        onSave={(obj) => {
          const result = upsertFinanceiro(obj);
          if (!result?.ok) alert(result?.message || "Nao foi possivel salvar conta.");
        }}
      />
    </div>
  );
}
