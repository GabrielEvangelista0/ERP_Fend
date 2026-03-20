'use client';

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import SummaryCard from "@/components/SummaryCard/SummaryCard";
import DetalhesConta from "@/components/DetalhesConta/DetalhesConta";
import { formatCurrency } from "@/utils/currency";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
  const { contasReceber, contasPagar, vendas, compras, upsertFinanceiro, markContaReceberAsPaid, markContaPagarAsPaid, canEdit } = useApp();
  const [filtro, setFiltro] = useState("receber");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalheSelecionado, setDetalheSelecionado] = useState(null);
  const [editing, setEditing] = useState(null);

  const dadosBase = filtro === "receber" ? contasReceber : contasPagar;
  const dados = dadosBase.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(item).some((v) => String(v).toLowerCase().includes(q));
  });

  const handleVerDetalhes = (conta) => {
    setDetalheSelecionado(conta);
    setDetalhesOpen(true);
  };

  const resumo = useMemo(() => {
    const totalReceber = contasReceber
      .filter((c) => (c.status || "").toLowerCase() === "pendente")
      .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const totalPagar = contasPagar
      .filter((c) => (c.status || "").toLowerCase() === "pendente")
      .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const faturamento = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const pendentesReceber = contasReceber.filter((d) => (d.status || "").toLowerCase() === "pendente").length;
    const pendentesPagar = contasPagar.filter((d) => (d.status || "").toLowerCase() === "pendente").length;
    const fluxo = totalReceber - totalPagar;

    return [
      { titulo: "Faturamento", valor: formatCurrency(faturamento), descricao: `${vendas.length} vendas`, destaque: true },
      { titulo: "Contas a pagar", valor: formatCurrency(totalPagar), descricao: `${pendentesPagar} pendente(s)`, destaque: false },
      { titulo: "Fluxo de caixa", valor: formatCurrency(fluxo), descricao: fluxo >= 0 ? "Positivo" : "Negativo", destaque: fluxo >= 0 },
      { titulo: "Contas a receber", valor: formatCurrency(totalReceber), descricao: `${pendentesReceber} pendente(s)`, destaque: false },
    ];
  }, [contasReceber, contasPagar, vendas]);

  return (
    <div className="flex-1 min-h-screen">
      <PageHeader titulo="Financeiro" descricao="Gestao financeira e fluxo de caixa" />

      <div className="grid grid-cols-4 gap-4 px-8 py-6">
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
          tipo={filtro === "receber" ? "financeiro-receber" : "financeiro-pagar"}
          onEdit={handleVerDetalhes}
          onStatusChange={async (item) => {
            const result = filtro === "receber" ? await markContaReceberAsPaid(item.id) : await markContaPagarAsPaid(item.id);
            if (!result?.ok) alert(result?.message || "Nao foi possivel confirmar pagamento.");
          }}
        />
      </div>

      <DetalhesConta
        open={detalhesOpen}
        onClose={() => setDetalhesOpen(false)}
        tipo={filtro}
        dados={detalheSelecionado}
        vendas={vendas}
        compras={compras}
      />

      <CreateEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo="financeiro"
        initial={editing}
        onSave={async (obj) => {
          const result = await upsertFinanceiro(obj);
          if (!result?.ok) alert(result?.message || "Nao foi possivel salvar conta.");
        }}
      />
    </div>
  );
}
