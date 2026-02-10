import React from 'react';
import './TabelaDados.css';
import { formatCurrency } from '@/utils/currency';

const TabelaDados = ({ dados, tipo, onEdit, onStatusChange }) => {
    const columnsByType = {
        cliente: ['nome', 'email', 'telefone', 'endereco', 'acoes'],
        fornecedor: ['nome', 'email', 'telefone', 'cnpj', 'acoes'],
        produto: ['nome', 'categoria', 'preco', 'estoque', 'acoes'],
        venda: ['data', 'cliente', 'items', 'total', 'acoes'],
        compra: ['data', 'fornecedor', 'items', 'total', 'acoes'],
        financeiro: ['descricao', 'valor', 'vencimento', 'status', 'acoes'],
    };

    const headersByType = {
        cliente: ['Nome', 'Email', 'Telefone', 'Endereço', 'Editar'],
        fornecedor: ['Nome', 'Email', 'Telefone', 'CNPJ', 'Editar'],
        produto: ['Nome', 'Categoria', 'Preço', 'Estoque', 'Editar'],
        venda: ['Data', 'Cliente', 'Items', 'Total', 'Editar'],
        compra: ['Data', 'Fornecedor', 'Items', 'Total', 'Editar'],
        financeiro: ['Descrição', 'Valor', 'Vencimento', 'Status', 'Ações'],
    };

    const getColumnsForType = () => columnsByType[tipo] || Object.keys(dados[0] || {});
    const getHeadersForType = () => headersByType[tipo] || getColumnsForType();

    const readValue = (obj, path) => {
        if (!obj) return '-';
        // support dot notation like 'fornecedor'
        if (path.includes('.')) {
            return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj) ?? '-';
        }
        const v = obj[path];
        if (Array.isArray(v)) return v.length;
        // format currency for financeiro.valor and venda/compra.total
        if (tipo === 'financeiro' && path.toLowerCase().includes('valor')) {
            return typeof v === 'number' ? formatCurrency(v) : v ?? '-';
        }
        if ((tipo === 'venda' || tipo === 'compra') && path.toLowerCase().includes('total')) {
            return typeof v === 'number' ? formatCurrency(v) : v ?? '-';
        }
        return v ?? '-';
    };

    const renderLinhas = () => {
        const columns = getColumnsForType();
        return dados.map((item, index) => (
            <tr key={index}>
                {columns.map((col) => {
                    // financeiro.status renders as button if status is Pendente
                    if (tipo === 'financeiro' && col === 'status') {
                        const isPending = (item.status || '').toLowerCase() === 'pendente';
                        return (
                            <td key={col}>
                                {isPending ? (
                                    <button
                                        onClick={() => {
                                            const updated = { ...item, status: 'Pago' };
                                            onStatusChange && onStatusChange(updated);
                                        }}
                                        className="px-3 py-1 bg-[#001A23] text-white rounded text-sm hover:bg-[#5386E4] cursor-pointer"
                                    >
                                        Confirmar Pagamento
                                    </button>
                                ) : (
                                    <span className="text-gray-600 font-medium">Pago</span>
                                )}
                            </td>
                        );
                    }
                    return (
                        <td key={col}>
                            {col === 'acoes' || col === 'editar' ? (
                                <button
                                    onClick={() => onEdit && onEdit(item)}
                                    className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                    Editar
                                </button>
                            ) : (
                                readValue(item, col)
                            )}
                        </td>
                    );
                })}
            </tr>
        ));
    };

    return (
        <table className="tabela">
            <thead>
                <tr>
                    {getHeadersForType().map((cabecalho, index) => (
                        <th key={index}>{cabecalho}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {renderLinhas()}
            </tbody>
        </table>
    );
};

export default TabelaDados;