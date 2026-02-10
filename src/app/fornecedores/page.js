"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import CreateEditModal from "@/components/CreateEditModal/CreateEditModal";
import { fornecedores as fornecedoresDados } from "@/data/fornecedores";

export default function Page() {
    const [query, setQuery] = useState("");
    const [dados, setDados] = useState(fornecedoresDados);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const filtered = dados.filter(item => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return Object.values(item).some(v => String(v).toLowerCase().includes(q));
    });

    return (
        <div className="flex-1 min-h-screen flex flex-col">
            <PageHeader titulo="Fornecedores" descricao="Gerenciamento de fornecedores" botaoNome="+ novo fornecedor" onCreate={() => { setEditing(null); setModalOpen(true); }} />
            <div className="p-8 bg-white mx-8 my-8 rounded-lg border border-gray-200 flex flex-col flex-1">
                <SearchBar value={query} onChange={setQuery} />
                <TabelaDados dados={filtered} tipo="fornecedor" onEdit={(item) => { setEditing(item); setModalOpen(true); }} />
            </div>

            <CreateEditModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                tipo="fornecedor"
                initial={editing}
                onSave={(obj) => {
                    if (editing) {
                        setDados((prev) => prev.map(p => p.id === editing.id ? { ...p, ...obj } : p));
                    } else {
                        const next = { ...obj, id: Date.now() };
                        setDados((prev) => [next, ...prev]);
                    }
                }}
            />
        </div>
    )
}