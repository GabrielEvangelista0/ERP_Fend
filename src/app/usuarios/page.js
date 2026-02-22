'use client';

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
  const { usuarios, upsertUsuario, removeUsuario, canEdit } = useApp();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = usuarios.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(item).some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 min-h-screen flex flex-col">
      <PageHeader titulo="Usuarios" descricao="Cadastro de usuarios e perfis de acesso" botaoNome={canEdit("usuarios") ? "+ novo usuario" : undefined} onCreate={() => { setEditing(null); setModalOpen(true); }} />
      <div className="p-8 bg-white mx-8 my-8 rounded-lg border border-gray-200 flex flex-col flex-1">
        <SearchBar value={query} onChange={setQuery} />
        <TabelaDados
          dados={filtered}
          tipo="usuario"
          onEdit={canEdit("usuarios") ? (item) => { setEditing(item); setModalOpen(true); } : undefined}
          onDelete={canEdit("usuarios") ? (item) => {
            const result = removeUsuario(item.id);
            if (!result?.ok) alert(result?.message || "Nao foi possivel remover usuario.");
          } : undefined}
        />
      </div>

      <CreateEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo="usuario"
        initial={editing}
        onSave={async (obj) => {
          const result = await upsertUsuario(editing ? { ...editing, ...obj } : obj);
          if (!result?.ok) alert(result?.message || "Nao foi possivel salvar usuario.");
        }}
      />
    </div>
  );
}
