'use client';

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import TabelaDados from "@/components/TabelaDados/TabelaDados";
import SearchBar from "@/components/SearchBar/SearchBar";
import SummaryCard from '@/components/SummaryCard/SummaryCard';
import { contasReceber, contasPagar } from '@/data/financeiro';
import { parseCurrency, formatCurrency } from '@/utils/currency';
import CreateEditModal from '@/components/CreateEditModal/CreateEditModal';

export default function Page() {
    const [filtro, setFiltro] = useState("receber");
    const [dadosReceber, setDadosReceber] = useState(contasReceber);
    const [dadosPagar, setDadosPagar] = useState(contasPagar);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    return (
        <div className="flex-1 min-h-screen">
            <PageHeader titulo="Financeiro" descricao="Gestão financeira e fluxo de caixa" />

            {/* Cards de Resumo (dinâmicos) */}
            <div className="grid grid-cols-3 gap-4 px-8 py-6">
                {useMemo(() => {
                    const totalReceber = dadosReceber.reduce((acc, c) => acc + parseCurrency(c.valor), 0);
                    const totalPagar = dadosPagar.reduce((acc, c) => acc + parseCurrency(c.valor), 0);
                    const pendentesReceber = dadosReceber.filter(d => (d.status || '').toLowerCase() === 'pendente').length;
                    const pendentesPagar = dadosPagar.filter(d => (d.status || '').toLowerCase() === 'pendente').length;
                    const fluxo = totalReceber - totalPagar;

                    const resumo = [
                        { titulo: 'Contas a Pagar', valor: formatCurrency(totalPagar), descricao: `${pendentesPagar} pendente(s) • ${dadosPagar.length} total`, destaque: false },
                        { titulo: 'Fluxo de Caixa', valor: formatCurrency(fluxo), descricao: fluxo >= 0 ? 'Positivo' : 'Negativo', destaque: fluxo >= 0 },
                        { titulo: 'Contas a Receber', valor: formatCurrency(totalReceber), descricao: `${pendentesReceber} pendente(s) • ${dadosReceber.length} total`, destaque: false },
                    ];

                    return resumo.map((card, idx) => (
                        <SummaryCard key={idx} titulo={card.titulo} valor={card.valor} descricao={card.descricao} destaque={card.destaque} />
                    ));
                }, [dadosReceber, dadosPagar])}
            </div>

            {/* Filtros e Botão */}
            <div className="px-8 py-4 flex items-center gap-3 justify-center flex-wrap">
                <button
                    onClick={() => setFiltro("pagar")}
                    className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${
                        filtro === "pagar"
                            ? "bg-gray-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                >
                    Contas a Pagar
                </button>
                <button
                    onClick={() => setFiltro("receber")}
                    className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${
                        filtro === "receber"
                            ? "bg-gray-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                >
                    Contas a Receber
                </button>
                <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 font-medium whitespace-nowrap ml-auto">
                    {'+ nova conta a pagar'}
                </button>
            </div>

            {/* Tabela */}
            <div className="p-8 bg-white mx-8 rounded-lg border border-gray-200">
                <SearchBar value={filtro === 'receber' ? '' : ''} onChange={() => {}} placeholder={filtro === 'receber' ? 'Buscar contas a receber' : 'Buscar contas a pagar'} />
                <TabelaDados 
                    dados={filtro === "receber" ? dadosReceber : dadosPagar} 
                    tipo="financeiro" 
                    onEdit={(item) => { setEditing(item); setModalOpen(true); }}
                    onStatusChange={(item) => {
                        if (filtro === 'receber') {
                            setDadosReceber(prev => prev.map(p => p.id === item.id ? item : p));
                        } else {
                            setDadosPagar(prev => prev.map(p => p.id === item.id ? item : p));
                        }
                    }}
                />
            </div>

            <CreateEditModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                tipo="financeiro"
                initial={editing}
                onSave={(obj) => {
                    if (editing) {
                        if (editing.id && dadosReceber.find(d => d.id === editing.id)) {
                            setDadosReceber(prev => prev.map(p => p.id === editing.id ? { ...p, ...obj } : p));
                        } else {
                            setDadosPagar(prev => prev.map(p => p.id === editing.id ? { ...p, ...obj } : p));
                        }
                    } else {
                        const next = { ...obj, id: Date.now().toString().slice(0,8), status: 'Pendente' };
                        setDadosPagar(prev => [next, ...prev]);
                    }
                }}
            />
        </div>
    )
}