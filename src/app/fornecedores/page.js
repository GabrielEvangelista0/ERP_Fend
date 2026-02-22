"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { useApp } from "@/providers/AppProvider";

export default function Page() {
    const { fornecedores, upsertFornecedor, removeFornecedor, canEdit } = useApp();
    const [query, setQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const filtered = fornecedores.filter(item => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return Object.values(item).some(v => String(v).toLowerCase().includes(q));
    });

    return (
        <div className="flex-1 min-h-screen flex flex-col">
            <PageHeader titulo="Fornecedores" descricao="Gerenciamento de fornecedores" botaoNome={canEdit("fornecedores") ? "+ novo fornecedor" : undefined} onCreate={() => { setEditing(null); setModalOpen(true); }} />
            <div className="p-8 bg-white mx-8 my-8 rounded-lg border border-gray-200 flex flex-col flex-1">
                <SearchBar value={query} onChange={setQuery} />
                <TabelaDados
                    dados={filtered}
                    tipo="fornecedor"
                    onEdit={canEdit("fornecedores") ? (item) => { setEditing(item); setModalOpen(true); } : undefined}
                    onDelete={canEdit("fornecedores") ? (item) => {
                        const result = removeFornecedor(item.id);
                        if (!result?.ok) alert(result?.message || "Nao foi possivel remover fornecedor.");
                    } : undefined}
                />
            </div>

            <CreateEditModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                tipo="fornecedor"
                initial={editing}
                onSave={(obj) => {
                    const result = upsertFornecedor(editing ? { ...editing, ...obj } : obj);
                    if (!result?.ok) alert(result?.message || "Nao foi possivel salvar fornecedor.");
                }}
            />
        </div>
    )
}
