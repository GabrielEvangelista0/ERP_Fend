"use client";

import { useState, useEffect } from "react";
import { clientes } from '@/data/clientes';
import { fornecedores } from '@/data/fornecedores';
import { produtos } from '@/data/produtos';

export default function CreateEditModal({ open, onClose, tipo, onSave, initial }) {
    const [form, setForm] = useState({});
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (initial) {
            setForm(initial);
            setItems(initial?.itemsDetalhados || []);
        } else {
            // Se for nova transação, definir data atual
            if (tipo === 'venda' || tipo === 'compra') {
                const hoje = new Date().toISOString().split('T')[0];
                setForm({ data: hoje });
            } else {
                setForm({});
            }
            setItems([]);
        }
    }, [initial, open, tipo]);

    if (!open) return null;

    const fieldsByType = {
        cliente: ['nome', 'email', 'telefone', 'endereco'],
        fornecedor: ['nome', 'email', 'telefone', 'cnpj', 'endereco'],
        produto: ['nome', 'categoria', 'preco', 'estoque'],
        venda: ['data', 'cliente', 'items', 'total', 'status'],
        compra: ['data', 'fornecedor', 'items', 'total', 'status'],
        financeiro: ['descricao', 'fornecedor', 'valor', 'vencimento'],
    };

    const fields = fieldsByType[tipo] || Object.keys(initial || {});

    const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const numericFieldNames = ['valor', 'preco', 'estoque', 'items', 'total'];

    // Função para converter preço formatado para número
    const parsePreco = (precoStr) => {
        if (typeof precoStr === 'number') return precoStr;
        if (!precoStr) return 0;

        // Remove "R$", espaços, pontos (milhares) e converte vírgula para ponto
        const numero = String(precoStr)
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(/,/g, '.');

        return parseFloat(numero) || 0;
    };

    // Para vendas e compras
    const isTransacao = tipo === 'venda' || tipo === 'compra';

    const addItem = () => {
        setItems([...items, { produtoId: '', produtoNome: '', quantidade: 1, preco: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calcular preço se selecionou produto
        if (field === 'produtoId') {
            const produto = produtos.find(p => p.id === Number(value));
            if (produto) {
                newItems[index].preco = parsePreco(produto.preco);
                newItems[index].produtoNome = produto.nome;
            }
        }

        setItems(newItems);
    };

    const calcularTotal = () => {
        return items.reduce((acc, item) => {
            const quantidade = Number(item.quantidade) || 0;
            const preco = Number(item.preco) || 0;
            return acc + (quantidade * preco);
        }, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isTransacao) {
            // Para vendas/compras, incluir items e calcular total
            const payload = {
                ...form,
                items: items.length,
                total: calcularTotal(),
                itemsDetalhados: items,
            };
            onSave(payload);
        } else {
            // Para outros tipos, converter campos numéricos
            const payload = { ...form };
            Object.keys(payload).forEach((k) => {
                if (numericFieldNames.includes(k)) {
                    const raw = payload[k];
                    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));
                    payload[k] = isNaN(n) ? payload[k] : n;
                }
            });
            onSave(payload);
        }

        onClose();
        setForm({});
        setItems([]);
    };

    // Renderizar form para vendas/compras
    if (isTransacao) {
        const isVenda = tipo === 'venda';
        const entidadeList = isVenda ? clientes : fornecedores;
        const entidadeLabel = isVenda ? 'Cliente' : 'Fornecedor';
        const entidadeKey = isVenda ? 'cliente' : 'fornecedor';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">
                        {initial ? 'Editar' : 'Nova'} {tipo}
                    </h3>

                    {/* Data */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Data</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={form.data || ''}
                            onChange={(e) => handleChange('data', e.target.value)}
                            required
                        />
                    </div>

                    {/* Cliente/Fornecedor */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">{entidadeLabel}</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded"
                            value={form[entidadeKey] || ''}
                            onChange={(e) => handleChange(entidadeKey, e.target.value)}
                            required
                        >
                            <option value="">Selecione {entidadeLabel}</option>
                            {entidadeList.map((ent) => (
                                <option key={ent.id} value={ent.nome}>
                                    {ent.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Produtos</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-3 py-1 bg-[#001A23] text-white rounded text-sm hover:bg-[#5386E4] cursor-pointer"
                            >
                                + Adicionar Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 border border-gray-200 rounded bg-gray-50">
                                    <div className="flex-1">
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            value={item.produtoId || ''}
                                            onChange={(e) => updateItem(index, 'produtoId', e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione produto</option>
                                            {produtos.map((p) => {
                                                const preco = parsePreco(p.preco);
                                                return (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nome} - R$ {preco.toFixed(2)}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            placeholder="Qtd"
                                            value={item.quantidade || ''}
                                            onChange={(e) => updateItem(index, 'quantidade', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-28">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            placeholder="Preço"
                                            value={item.preco || ''}
                                            onChange={(e) => updateItem(index, 'preco', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="px-2 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {items.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Nenhum item adicionado
                            </p>
                        )}
                    </div>

                    {/* Total */}
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Total de items:</span>
                            <span className="font-bold">{items.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="font-medium">Valor Total:</span>
                            <span className="font-bold text-lg text-green-600">
                                R$ {calcularTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>
                    {/*botoes cancelar e salvar*/}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-800 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={items.length === 0}
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Renderizar form padrão para outros tipos
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-96">
                <h3 className="text-lg font-bold mb-4">{initial ? 'Editar' : 'Criar'} {tipo}</h3>
                <div className="flex flex-col gap-3">
                    {fields.map((f) => {
                        const isNumeric = ['valor', 'preco', 'estoque', 'items', 'total'].includes(f);
                        return (
                            <input
                                key={f}
                                type={isNumeric ? 'number' : 'text'}
                                step={isNumeric ? '0.01' : undefined}
                                className="p-2 border border-gray-300 rounded"
                                placeholder={f}
                                value={form[f] ?? ''}
                                onChange={(e) => handleChange(f, isNumeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                            />
                        )
                    })}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancelar</button>
                    <button type="submit" className="px-3 py-1 rounded bg-gray-900 text-white">Salvar</button>
                </div>
            </form>
        </div>
    )
}