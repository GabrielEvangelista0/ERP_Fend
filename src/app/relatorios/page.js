'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard/SummaryCard';
import { vendas } from '@/data/vendas';
import { compras } from '@/data/compras';
import { produtos } from '@/data/produtos';
import { clientes } from '@/data/clientes';
import { contasReceber, contasPagar } from '@/data/financeiro';
import { formatCurrency } from '@/utils/currency';

export default function Page() {
    const [relatorioSelecionado, setRelatorioSelecionado] = useState('vendas');

    const relatorios = [
        { id: 'vendas', nome: 'Relatório de Vendas', descricao: 'Análise detalhada de vendas' },
        { id: 'estoque', nome: 'Relatório de Estoque', descricao: 'Movimentação de produtos' },
        { id: 'financeiro', nome: 'Relatório Financeiro', descricao: 'Fluxo de caixa' },
        { id: 'clientes', nome: 'Relatório de Clientes', descricao: 'Análise de clientes' }
    ];

    // Relatório de Vendas
    const relatorioVendas = () => {
        const totalVendas = vendas.reduce((s, v) => s + (Number(v.total) || 0), 0);
        const totalItems = vendas.reduce((s, v) => s + (Number(v.items) || 0), 0);
        const vendePorCliente = {};
        vendas.forEach(v => {
            vendePorCliente[v.cliente] = (vendePorCliente[v.cliente] || 0) + (Number(v.total) || 0);
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard titulo="Total de Vendas" valor={formatCurrency(totalVendas)} descricao={`${vendas.length} vendas`} destaque={true} />
                    <SummaryCard titulo="Total de Items" valor={`${totalItems} un.`} descricao="Produtos vendidos" destaque={false} />
                    <SummaryCard titulo="Ticket Médio" valor={formatCurrency(totalVendas / (vendas.length || 1))} descricao="Por venda" destaque={false} />
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold mb-4">Top Clientes por Vendas</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left">Cliente</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3 text-right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(vendePorCliente)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([cliente, total]) => (
                                    <tr key={cliente} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{cliente}</td>
                                        <td className="p-3 text-right">{formatCurrency(total)}</td>
                                        <td className="p-3 text-right">{((total / totalVendas) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Relatório de Estoque
    const relatorioEstoque = () => {
        const totalEstoque = produtos.reduce((s, p) => s + (Number(p.estoque) || 0), 0);
        const estoqueporCategoria = {};
        produtos.forEach(p => {
            estoqueporCategoria[p.categoria] = (estoqueporCategoria[p.categoria] || 0) + (Number(p.estoque) || 0);
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard titulo="Total em Estoque" valor={`${totalEstoque} un.`} descricao={`${produtos.length} produtos`} destaque={true} />
                    <SummaryCard titulo="Categorias" valor={Object.keys(estoqueporCategoria).length} descricao="Diferentes tipos" destaque={false} />
                    <SummaryCard titulo="Valor Total" valor={formatCurrency(produtos.reduce((s,p) => s + (Number(p.preco) || 0) * (Number(p.estoque) || 0), 0))} descricao="Custo de estoque" destaque={false} />
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold mb-4">Estoque por Categoria</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left">Categoria</th>
                                <th className="p-3 text-right">Unidades</th>
                                <th className="p-3 text-right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(estoqueporCategoria)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, total]) => (
                                    <tr key={cat} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{cat}</td>
                                        <td className="p-3 text-right">{total} un.</td>
                                        <td className="p-3 text-right">{((total / totalEstoque) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Relatório Financeiro
    const relatorioFinanceiro = () => {
        const totalReceber = contasReceber.reduce((s, c) => s + (Number(c.valor) || 0), 0);
        const totalPagar = contasPagar.reduce((s, c) => s + (Number(c.valor) || 0), 0);
        const pendentesReceber = contasReceber.filter(c => c.status === 'Pendente').length;
        const pendentesPagar = contasPagar.filter(c => c.status === 'Pendente').length;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard titulo="Contas a Receber" valor={formatCurrency(totalReceber)} descricao={`${pendentesReceber} pendentes`} destaque={false} />
                    <SummaryCard titulo="Contas a Pagar" valor={formatCurrency(totalPagar)} descricao={`${pendentesPagar} pendentes`} destaque={false} />
                    <SummaryCard titulo="Fluxo Líquido" valor={formatCurrency(totalReceber - totalPagar)} descricao={totalReceber >= totalPagar ? 'Positivo' : 'Negativo'} destaque={totalReceber >= totalPagar} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold mb-4">Contas a Receber</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-2 text-left">Descrição</th>
                                    <th className="p-2 text-right">Valor</th>
                                    <th className="p-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contasReceber.slice(0, 5).map((c, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{c.descricao}</td>
                                        <td className="p-2 text-right">{formatCurrency(c.valor)}</td>
                                        <td className="p-2 text-center text-xs font-medium">{c.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold mb-4">Contas a Pagar</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-2 text-left">Descrição</th>
                                    <th className="p-2 text-right">Valor</th>
                                    <th className="p-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contasPagar.slice(0, 5).map((c, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{c.descricao}</td>
                                        <td className="p-2 text-right">{formatCurrency(c.valor)}</td>
                                        <td className="p-2 text-center text-xs font-medium">{c.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Relatório de Clientes
    const relatorioClientes = () => {
        const totalClientes = clientes.length;
        const contatosPorTipo = {};
        clientes.forEach(c => {
            contatosPorTipo[c.endereco ? 'Com Endereço' : 'Sem Endereço'] = (contatosPorTipo[c.endereco ? 'Com Endereço' : 'Sem Endereço'] || 0) + 1;
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard titulo="Total de Clientes" valor={totalClientes} descricao="Cadastrados" destaque={true} />
                    <SummaryCard titulo="Contatos de Email" valor={clientes.filter(c => c.email).length} descricao="Com email" destaque={false} />
                    <SummaryCard titulo="Contatos de Telefone" valor={clientes.filter(c => c.telefone).length} descricao="Com telefone" destaque={false} />
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold mb-4">Listagem de Clientes</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left">Nome</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Telefone</th>
                                <th className="p-3 text-left">Endereço</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((c, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{c.nome}</td>
                                    <td className="p-3 text-gray-600 text-xs">{c.email || '-'}</td>
                                    <td className="p-3 text-gray-600 text-xs">{c.telefone || '-'}</td>
                                    <td className="p-3 text-gray-600 text-xs">{c.endereco || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderRelatorio = () => {
        switch (relatorioSelecionado) {
            case 'vendas': return relatorioVendas();
            case 'estoque': return relatorioEstoque();
            case 'financeiro': return relatorioFinanceiro();
            case 'clientes': return relatorioClientes();
            default: return null;
        }
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col">
            <PageHeader titulo="Relatórios" descricao="Consulte os relatórios do sistema" />

            <div className="flex-1 p-8">
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {relatorios.map((relatorio) => (
                        <button
                            key={relatorio.id}
                            onClick={() => setRelatorioSelecionado(relatorio.id)}
                            className={`p-6 rounded-lg border-2 text-left transition-all ${
                                relatorioSelecionado === relatorio.id
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <h3 className="font-bold text-black mb-2">{relatorio.nome}</h3>
                            <p className="text-gray-600 text-sm">{relatorio.descricao}</p>
                        </button>
                    ))}
                </div>

                {/* Conteúdo Relatório */}
                {renderRelatorio()}
            </div>
        </div>
    )
}
