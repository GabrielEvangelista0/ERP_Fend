'use client';

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
  const { compras, registerCompra, canEdit } = useApp();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = compras.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(item).some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      <PageHeader titulo="Compras" descricao="Registro de compras de fornecedores" botaoNome={canEdit("compras") ? "+ nova compra" : undefined} onCreate={() => setModalOpen(true)} />
      <div className="p-8 bg-white mx-8 my-8 rounded-lg border border-gray-200 flex flex-col flex-1">
        <SearchBar value={query} onChange={setQuery} />
        <h2 className="text-lg font-bold mb-6 text-black">Historico de compras</h2>
        <TabelaDados dados={filtered} tipo="compra" />
      </div>

      <CreateEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo="compra"
        onSave={(obj) => {
          const result = registerCompra(obj);
          if (!result.ok) alert(result.message);
        }}
      />
    </div>
  );
}
