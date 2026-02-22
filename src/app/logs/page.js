'use client';

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
  const { logs } = useApp();
  const [query, setQuery] = useState("");

  const filtered = logs.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(item).some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      <PageHeader titulo="Logs de Atividades" descricao="Operacoes realizadas pelos usuarios" />
      <div className="p-8 bg-white mx-8 my-8 rounded-lg border border-gray-200 flex flex-col flex-1">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por usuario, acao ou detalhes" />
        <TabelaDados dados={filtered} tipo="log" />
      </div>
    </div>
  );
}
