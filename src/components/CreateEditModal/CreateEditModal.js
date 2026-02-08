"use client";

import { useState, useEffect } from "react";

export default function CreateEditModal({ open, onClose, tipo, onSave, initial }) {
    const [form, setForm] = useState({});

    useEffect(() => {
        setForm(initial || {});
    }, [initial, open]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // convert numeric-like fields
        const payload = { ...form };
        Object.keys(payload).forEach((k) => {
            if (numericFieldNames.includes(k)) {
                const raw = payload[k];
                const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));
                payload[k] = isNaN(n) ? payload[k] : n;
            }
        });
        onSave(payload);
        onClose();
    };

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
