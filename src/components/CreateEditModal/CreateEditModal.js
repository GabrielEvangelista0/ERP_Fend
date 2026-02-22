"use client";

import { useEffect, useMemo, useState } from "react";
import { parseCurrency } from "@/utils/currency";
import { useApp } from "@/providers/AppProvider";

function nextProductCode(existing) {
  const max = existing.reduce((acc, p) => {
    const raw = String(p.codigo || "").replace(/[^0-9]/g, "");
    const n = Number(raw) || 0;
    return Math.max(acc, n);
  }, 0);
  return `P${String(max + 1).padStart(4, "0")}`;
}

export default function CreateEditModal({ open, onClose, tipo, onSave, initial }) {
  const { clientes, fornecedores, produtos, compras, currentUser } = useApp();
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);

  const isTransacao = tipo === "venda" || tipo === "compra";
  const produtosSelect = useMemo(() => produtos.map((p) => ({ ...p, precoN: parseCurrency(p.preco) })), [produtos]);
  const inferredCompraFornecedor = useMemo(() => {
    if (tipo !== "compra" || !items.length) return { fornecedorId: null, mixed: false };
    const fornecedorIds = items
      .map((item) => {
        const prod = produtos.find((p) => p.id === Number(item.produtoId));
        return prod?.fornecedorId ? Number(prod.fornecedorId) : null;
      })
      .filter((id) => id != null);
    if (!fornecedorIds.length) return { fornecedorId: null, mixed: false };
    const unique = [...new Set(fornecedorIds)];
    if (unique.length > 1) return { fornecedorId: null, mixed: true };
    return { fornecedorId: unique[0], mixed: false };
  }, [tipo, items, produtos]);

  useEffect(() => {
    if (!open) return;
    const hoje = new Date().toISOString().split("T")[0];

    if (initial) {
      if (tipo === "produto") {
        setForm({
          ...initial,
          quantidade: initial.quantidade ?? initial.estoque ?? 0,
          fornecedorId: initial.fornecedorId ?? "",
        });
      } else {
        setForm(initial);
      }
      setItems(initial.itemsDetalhados || []);
      return;
    }

    if (tipo === "venda") {
      setForm({ data: hoje, clienteId: "", usuarioResponsavelId: currentUser?.id || null });
    } else if (tipo === "compra") {
      setForm({ data: hoje, fornecedorId: "", usuarioResponsavelId: currentUser?.id || null });
    } else if (tipo === "financeiro") {
      setForm({ tipoConta: "pagar", valor: "", vencimento: hoje, tipo: "compra", compraId: "", clienteId: "" });
    } else if (tipo === "usuario") {
      setForm({ tipo: "operador" });
    } else if (tipo === "produto") {
      setForm({ codigo: nextProductCode(produtos), nome: "", descricao: "", categoria: "", preco: "", quantidade: 0, fornecedorId: "" });
    } else {
      setForm({});
    }
    setItems([]);
  }, [open, tipo, initial, currentUser, produtos]);

  if (!open) return null;

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const addItem = () => setItems((prev) => [...prev, { produtoId: "", produtoNome: "", quantidade: 1, preco: 0 }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      if (key === "produtoId") {
        const prod = produtosSelect.find((p) => p.id === Number(value));
        if (prod) {
          next[idx].produtoNome = prod.nome;
          next[idx].preco = prod.precoN;
        }
      }
      return next;
    });
  };

  const total = items.reduce((acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.preco) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTransacao) {
      const resolvedFornecedorId = tipo === "compra" ? (inferredCompraFornecedor.fornecedorId || form.fornecedorId || "") : form.fornecedorId;
      onSave({
        ...form,
        fornecedorId: resolvedFornecedorId,
        itemsDetalhados: items,
        items: items.length,
        total,
      });
      onClose();
      return;
    }

    const payload = { ...form };
    if (payload.valor != null) payload.valor = Number(payload.valor) || 0;
    if (payload.preco != null) payload.preco = Number(payload.preco) || 0;
    if (payload.quantidade != null) payload.quantidade = Number(payload.quantidade) || 0;
    if (payload.fornecedorId != null && payload.fornecedorId !== "") payload.fornecedorId = Number(payload.fornecedorId);
    if (payload.clienteId != null && payload.clienteId !== "") payload.clienteId = Number(payload.clienteId);
    if (payload.compraId != null && payload.compraId !== "") payload.compraId = String(payload.compraId);

    if (tipo === "produto") {
      payload.estoque = payload.quantidade;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg ${isTransacao ? "w-[760px]" : "w-[460px]"} max-h-[90vh] overflow-y-auto`}>
        <h3 className="text-lg font-bold mb-4">{initial ? "Editar" : "Novo"} {tipo}</h3>

        {isTransacao ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input required type="date" className="p-2 border border-gray-300 rounded" value={form.data || ""} onChange={(e) => setValue("data", e.target.value)} />
              {tipo === "venda" ? (
                <select required className="p-2 border border-gray-300 rounded" value={form.clienteId || ""} onChange={(e) => setValue("clienteId", Number(e.target.value))}>
                  <option value="">Cliente (FK)</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} (ID {c.id})</option>
                  ))}
                </select>
              ) : (
                inferredCompraFornecedor.fornecedorId ? (
                  <input
                    disabled
                    className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
                    value={`${fornecedores.find((f) => Number(f.id) === Number(inferredCompraFornecedor.fornecedorId))?.nome || "Fornecedor"} (ID ${inferredCompraFornecedor.fornecedorId}) - Automatico pelo produto`}
                  />
                ) : (
                  <select required className="p-2 border border-gray-300 rounded" value={form.fornecedorId || ""} onChange={(e) => setValue("fornecedorId", Number(e.target.value))}>
                    <option value="">Fornecedor (FK)</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome} (ID {f.id})</option>
                    ))}
                  </select>
                )
              )}
            </div>
            {tipo === "compra" && inferredCompraFornecedor.mixed ? (
              <p className="text-xs text-amber-700 mb-3">Produtos com fornecedores diferentes. Defina um fornecedor manualmente para a compra.</p>
            ) : null}

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Usuario responsavel (FK)</label>
              <input type="text" disabled className="p-2 border border-gray-300 rounded w-full bg-gray-100 text-gray-700" value={`${currentUser?.login || "sistema"} (ID ${currentUser?.id || "-"})`} />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Itens ({tipo === "venda" ? "Item Venda" : "Item Compra"})</span>
                <button type="button" onClick={addItem} className="px-3 py-1 bg-gray-900 text-white rounded text-sm">+ Item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_110px_120px_70px] gap-2">
                    <select required className="p-2 border border-gray-300 rounded text-sm" value={item.produtoId || ""} onChange={(e) => updateItem(idx, "produtoId", e.target.value)}>
                      <option value="">Produto (FK)</option>
                      {produtosSelect.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} (ID {p.id}) - R$ {p.precoN.toFixed(2)}</option>
                      ))}
                    </select>
                    <input required type="number" min="1" className="p-2 border border-gray-300 rounded text-sm" value={item.quantidade || ""} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} />
                    <input type="text" disabled className="p-2 border border-gray-300 rounded text-sm bg-gray-100 text-gray-700" value={`R$ ${(Number(item.preco) || 0).toFixed(2)}`} />
                    <button type="button" onClick={() => removeItem(idx)} className="bg-red-600 text-white rounded text-sm">Remover</button>
                  </div>
                ))}
              </div>
              {!items.length ? <p className="text-sm text-gray-500 mt-3">Nenhum item adicionado.</p> : null}
            </div>

            <div className="bg-gray-100 rounded p-3 text-sm">
              <div className="flex justify-between"><span>Itens</span><span>{items.length}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {tipo === "cliente" ? (
              <>
                <input required className="p-2 border border-gray-300 rounded" placeholder="Nome" value={form.nome ?? ""} onChange={(e) => setValue("nome", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Telefone" value={form.telefone ?? ""} onChange={(e) => setValue("telefone", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Endereco" value={form.endereco ?? ""} onChange={(e) => setValue("endereco", e.target.value)} />
              </>
            ) : null}

            {tipo === "fornecedor" ? (
              <>
                <input required className="p-2 border border-gray-300 rounded" placeholder="Nome" value={form.nome ?? ""} onChange={(e) => setValue("nome", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Telefone" value={form.telefone ?? ""} onChange={(e) => setValue("telefone", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Endereco" value={form.endereco ?? ""} onChange={(e) => setValue("endereco", e.target.value)} />
              </>
            ) : null}

            {tipo === "produto" ? (
              <>
                <input required className="p-2 border border-gray-300 rounded bg-gray-100" placeholder="Codigo" value={form.codigo ?? ""} onChange={(e) => setValue("codigo", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Nome" value={form.nome ?? ""} onChange={(e) => setValue("nome", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Descricao" value={form.descricao ?? ""} onChange={(e) => setValue("descricao", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Categoria" value={form.categoria ?? ""} onChange={(e) => setValue("categoria", e.target.value)} />
                <input required type="number" step="0.01" min="0" className="p-2 border border-gray-300 rounded" placeholder="Preco" value={form.preco ?? ""} onChange={(e) => setValue("preco", e.target.value)} />
                <input required type="number" min="0" className="p-2 border border-gray-300 rounded" placeholder="Quantidade" value={form.quantidade ?? ""} onChange={(e) => setValue("quantidade", e.target.value)} />
                <select required className="p-2 border border-gray-300 rounded" value={form.fornecedorId ?? ""} onChange={(e) => setValue("fornecedorId", e.target.value)}>
                  <option value="">Fornecedor (FK)</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome} (ID {f.id})</option>
                  ))}
                </select>
              </>
            ) : null}

            {tipo === "financeiro" ? (
              <>
                <select className="p-2 border border-gray-300 rounded" value={form.tipoConta || "pagar"} onChange={(e) => setValue("tipoConta", e.target.value)}>
                  <option value="pagar">Conta a pagar</option>
                  <option value="receber">Conta a receber</option>
                </select>

                {form.tipoConta === "receber" ? (
                  <select required className="p-2 border border-gray-300 rounded" value={form.clienteId || ""} onChange={(e) => setValue("clienteId", Number(e.target.value))}>
                    <option value="">Cliente (FK)</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome} (ID {c.id})</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input required className="p-2 border border-gray-300 rounded" placeholder="Tipo (compra, aluguel, etc)" value={form.tipo ?? ""} onChange={(e) => setValue("tipo", e.target.value)} />
                    <select className="p-2 border border-gray-300 rounded" value={form.compraId || ""} onChange={(e) => setValue("compraId", e.target.value)}>
                      <option value="">Compra (FK) - opcional</option>
                      {compras.map((c) => (
                        <option key={c.id} value={c.id}>{c.id} - {c.fornecedor}</option>
                      ))}
                    </select>
                  </>
                )}

                <input required type="number" step="0.01" min="0" className="p-2 border border-gray-300 rounded" placeholder="Valor" value={form.valor ?? ""} onChange={(e) => setValue("valor", e.target.value)} />
                <input required type="date" className="p-2 border border-gray-300 rounded" value={form.vencimento ?? ""} onChange={(e) => setValue("vencimento", e.target.value)} />
              </>
            ) : null}

            {tipo === "usuario" ? (
              <>
                <input required className="p-2 border border-gray-300 rounded" placeholder="Nome" value={form.nome ?? ""} onChange={(e) => setValue("nome", e.target.value)} />
                <input required className="p-2 border border-gray-300 rounded" placeholder="Login (PK)" value={form.login ?? ""} onChange={(e) => setValue("login", e.target.value)} />
                <input required={!initial} type="password" className="p-2 border border-gray-300 rounded" placeholder={initial ? "Senha (opcional para manter atual)" : "Senha"} value={form.senha ?? ""} onChange={(e) => setValue("senha", e.target.value)} />
                <select className="p-2 border border-gray-300 rounded" value={form.tipo || "operador"} onChange={(e) => setValue("tipo", e.target.value)}>
                  <option value="administrador">Administrador</option>
                  <option value="operador">Operador</option>
                  <option value="gerente">Gerente</option>
                </select>
              </>
            ) : null}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1 rounded border border-gray-300">Cancelar</button>
          <button type="submit" className="px-3 py-1 rounded bg-gray-900 text-white disabled:bg-gray-500" disabled={isTransacao && !items.length}>Salvar</button>
        </div>
      </form>
    </div>
  );
}
