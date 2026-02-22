"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clientes as clientesBase } from "@/data/clientes";
import { fornecedores as fornecedoresBase } from "@/data/fornecedores";
import { produtos as produtosBase } from "@/data/produtos";
import { vendas as vendasBase } from "@/data/vendas";
import { compras as comprasBase } from "@/data/compras";
import { contasPagar as contasPagarBase, contasReceber as contasReceberBase } from "@/data/financeiro";
import { usuarios as usuariosBase } from "@/data/usuarios";
import { hashPassword } from "@/utils/security";
import { parseCurrency } from "@/utils/currency";

const STORAGE_KEY = "erp_state_v3";
const AppContext = createContext(null);

function nextId(prefix) {
  return `${prefix}${Date.now()}`;
}

function addDays(dateString, days) {
  const base = dateString ? new Date(dateString) : new Date();
  const d = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

const modulesByRole = {
  administrador: ["dashboard", "clientes", "fornecedores", "produtos", "vendas", "compras", "financeiro", "relatorios", "usuarios", "logs"],
  operador: ["dashboard", "clientes", "fornecedores", "produtos", "vendas", "compras", "financeiro"],
  gerente: ["dashboard", "clientes", "fornecedores", "produtos", "vendas", "compras", "financeiro", "relatorios", "logs"],
};

const defaultState = {
  clientes: clientesBase.map((c) => ({ id: Number(c.id), nome: c.nome, telefone: c.telefone, endereco: c.endereco })),
  fornecedores: fornecedoresBase.map((f) => ({ id: Number(f.id), nome: f.nome, telefone: f.telefone, endereco: f.endereco })),
  produtos: produtosBase.map((p, idx) => ({
    id: Number(p.id),
    codigo: p.codigo || `P${String(idx + 1).padStart(4, "0")}`,
    nome: p.nome,
    descricao: p.descricao || p.nome,
    categoria: p.categoria || "Geral",
    preco: Number(parseCurrency(p.preco) || 0),
    quantidade: Number(p.quantidade ?? p.estoque ?? 0),
    estoque: Number(p.quantidade ?? p.estoque ?? 0),
    fornecedorId: p.fornecedorId ? Number(p.fornecedorId) : null,
    fornecedor: p.fornecedor || "",
  })),
  vendas: vendasBase,
  compras: comprasBase,
  itemVendas: [],
  itemCompras: [],
  contasReceber: contasReceberBase.map((c) => ({ ...c, clienteId: c.clienteId ?? null, vendaId: c.vendaId ?? null })),
  contasPagar: contasPagarBase.map((c) => ({ ...c, tipo: c.tipo || "compra", compraId: c.compraId ?? null })),
  usuarios: usuariosBase,
  logs: [],
  currentUser: null,
};

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setState((prev) => ({ ...prev, ...parsed }));
      } catch (_) {
        setState(defaultState);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addLog = (acao, detalhes = "") => {
    setState((prev) => ({
      ...prev,
      logs: [
        { id: nextId("LOG-"), dataHora: new Date().toISOString(), usuario: prev.currentUser?.login || "sistema", acao, detalhes },
        ...prev.logs,
      ],
    }));
  };

  const canAccess = (moduleName) => {
    if (!state.currentUser) return false;
    return (modulesByRole[state.currentUser.tipo] || []).includes(moduleName);
  };

  const canEdit = (moduleName) => {
    if (!state.currentUser) return false;
    if (state.currentUser.tipo === "administrador") return true;
    if (state.currentUser.tipo === "operador") return moduleName !== "usuarios" && moduleName !== "logs";
    if (state.currentUser.tipo === "gerente") return moduleName === "financeiro";
    return false;
  };

  const login = async (loginName, senha) => {
    const user = state.usuarios.find((u) => u.login === loginName);
    if (!user) return { ok: false, message: "Usuario nao encontrado." };
    const hash = await hashPassword(senha);
    if (hash !== user.senhaHash) return { ok: false, message: "Senha invalida." };
    setState((prev) => ({ ...prev, currentUser: { id: user.id, nome: user.nome, login: user.login, tipo: user.tipo } }));
    setTimeout(() => addLog("LOGIN", `Acesso efetuado por ${loginName}`), 0);
    return { ok: true };
  };

  const logout = () => {
    const who = state.currentUser?.login;
    setState((prev) => ({ ...prev, currentUser: null }));
    if (who) setTimeout(() => addLog("LOGOUT", `Sessao encerrada por ${who}`), 0);
  };

  const upsertById = (key, value, label) => {
    const isEdit = Boolean(value.id);
    setState((prev) => {
      const id = isEdit ? value.id : Date.now();
      const normalized = { ...value, id };
      const list = isEdit ? prev[key].map((item) => (item.id === id ? normalized : item)) : [normalized, ...prev[key]];
      return { ...prev, [key]: list };
    });
    addLog(isEdit ? `ATUALIZAR_${label}` : `CADASTRAR_${label}`, `${label} ${value.nome || value.id || ""}`);
    return { ok: true };
  };

  const upsertProduto = (produto) => {
    const fornecedor = state.fornecedores.find((f) => f.id === Number(produto.fornecedorId));
    if (!fornecedor) return { ok: false, message: "Produto deve possuir fornecedor (FK)." };
    const payload = {
      ...produto,
      preco: Number(produto.preco) || 0,
      quantidade: Number(produto.quantidade ?? produto.estoque) || 0,
      estoque: Number(produto.quantidade ?? produto.estoque) || 0,
      fornecedorId: Number(produto.fornecedorId),
      fornecedor: fornecedor.nome,
    };
    return upsertById("produtos", payload, "PRODUTO");
  };

  const removeCliente = (id) => {
    const hasVenda = state.vendas.some((v) => Number(v.clienteId) === Number(id));
    const hasReceber = state.contasReceber.some((c) => Number(c.clienteId) === Number(id));
    if (hasVenda || hasReceber) return { ok: false, message: "Cliente vinculado a venda/conta a receber." };
    setState((prev) => ({ ...prev, clientes: prev.clientes.filter((item) => item.id !== id) }));
    addLog("REMOVER_CLIENTE", `CLIENTE id=${id}`);
    return { ok: true };
  };

  const removeFornecedor = (id) => {
    const hasCompra = state.compras.some((c) => Number(c.fornecedorId) === Number(id));
    const hasProduto = state.produtos.some((p) => Number(p.fornecedorId) === Number(id));
    if (hasCompra || hasProduto) return { ok: false, message: "Fornecedor vinculado a compra/produto." };
    setState((prev) => ({ ...prev, fornecedores: prev.fornecedores.filter((item) => item.id !== id) }));
    addLog("REMOVER_FORNECEDOR", `FORNECEDOR id=${id}`);
    return { ok: true };
  };

  const removeProduto = (id) => {
    const hasItemVenda = state.itemVendas.some((i) => Number(i.produtoId) === Number(id));
    const hasItemCompra = state.itemCompras.some((i) => Number(i.produtoId) === Number(id));
    if (hasItemVenda || hasItemCompra) return { ok: false, message: "Produto vinculado a itens de venda/compra." };
    setState((prev) => ({ ...prev, produtos: prev.produtos.filter((item) => item.id !== id) }));
    addLog("REMOVER_PRODUTO", `PRODUTO id=${id}`);
    return { ok: true };
  };

  const removeUsuario = (id) => {
    if (Number(state.currentUser?.id) === Number(id)) return { ok: false, message: "Nao e permitido remover o usuario logado." };
    const hasVenda = state.vendas.some((v) => Number(v.usuarioResponsavelId) === Number(id));
    const hasCompra = state.compras.some((c) => Number(c.usuarioResponsavelId) === Number(id));
    if (hasVenda || hasCompra) return { ok: false, message: "Usuario vinculado a vendas/compras." };
    setState((prev) => ({ ...prev, usuarios: prev.usuarios.filter((item) => item.id !== id) }));
    addLog("REMOVER_USUARIO", `USUARIO id=${id}`);
    return { ok: true };
  };

  const upsertUsuario = async (usuario) => {
    const isEdit = Boolean(usuario.id);
    const payload = { ...usuario };
    if (payload.senha) {
      payload.senhaHash = await hashPassword(payload.senha);
      delete payload.senha;
    }
    setState((prev) => {
      if (isEdit) return { ...prev, usuarios: prev.usuarios.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)) };
      return { ...prev, usuarios: [{ ...payload, id: Date.now() }, ...prev.usuarios] };
    });
    addLog(isEdit ? "ATUALIZAR_USUARIO" : "CADASTRAR_USUARIO", payload.login);
    return { ok: true };
  };

  const registerVenda = (payload) => {
    const cliente = state.clientes.find((c) => Number(c.id) === Number(payload.clienteId));
    if (!cliente) return { ok: false, message: "Venda sem cliente associado (FK)." };
    if (!payload.itemsDetalhados?.length) return { ok: false, message: "Venda sem itens." };

    const updates = new Map();
    for (const item of payload.itemsDetalhados) {
      const produto = state.produtos.find((p) => p.id === Number(item.produtoId));
      if (!produto) return { ok: false, message: "Item de venda sem produto associado." };
      const qtd = Number(item.quantidade) || 0;
      if (qtd <= 0) return { ok: false, message: "Quantidade invalida." };
      if (produto.estoque < qtd) return { ok: false, message: `Estoque insuficiente para ${produto.nome}.` };
      updates.set(produto.id, (updates.get(produto.id) || 0) + qtd);
    }

    const total = payload.itemsDetalhados.reduce((acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.preco) || 0), 0);
    const vendaId = nextId("V");
    const venda = {
      id: vendaId,
      data: payload.data || new Date().toISOString().split("T")[0],
      clienteId: cliente.id,
      cliente: cliente.nome,
      usuarioResponsavelId: state.currentUser?.id || null,
      usuarioResponsavel: state.currentUser?.login || "sistema",
      items: payload.itemsDetalhados.length,
      total,
      status: "Concluida",
    };
    const itemVendas = payload.itemsDetalhados.map((item) => ({
      id: nextId("IV"),
      vendaId,
      produtoId: Number(item.produtoId),
      qtd: Number(item.quantidade) || 0,
      valorUnitario: Number(item.preco) || 0,
    }));

    setState((prev) => ({
      ...prev,
      vendas: [venda, ...prev.vendas],
      itemVendas: [...itemVendas, ...prev.itemVendas],
      produtos: prev.produtos.map((p) => (updates.has(p.id) ? { ...p, estoque: p.estoque - updates.get(p.id), quantidade: p.estoque - updates.get(p.id) } : p)),
      contasReceber: [
        { id: nextId("CR"), valor: total, vencimento: addDays(venda.data, 30), clienteId: cliente.id, cliente: cliente.nome, vendaId: vendaId, status: "Pendente" },
        ...prev.contasReceber,
      ],
    }));
    addLog("REGISTRAR_VENDA", `Venda ${vendaId} para cliente ${cliente.id}`);
    return { ok: true };
  };

  const registerCompra = (payload) => {
    if (!payload.itemsDetalhados?.length) return { ok: false, message: "Compra sem itens." };

    const updates = new Map();
    const itemFornecedorIds = [];
    for (const item of payload.itemsDetalhados) {
      const produto = state.produtos.find((p) => p.id === Number(item.produtoId));
      if (!produto) return { ok: false, message: "Item de compra sem produto associado." };
      const qtd = Number(item.quantidade) || 0;
      if (qtd <= 0) return { ok: false, message: "Quantidade invalida." };
      updates.set(produto.id, (updates.get(produto.id) || 0) + qtd);
      if (produto.fornecedorId) itemFornecedorIds.push(Number(produto.fornecedorId));
    }

    const uniqueItemFornecedorIds = [...new Set(itemFornecedorIds)];
    let fornecedorId = payload.fornecedorId ? Number(payload.fornecedorId) : null;
    if (!fornecedorId && uniqueItemFornecedorIds.length === 1) {
      fornecedorId = uniqueItemFornecedorIds[0];
    }
    if (!fornecedorId && uniqueItemFornecedorIds.length > 1) {
      return { ok: false, message: "Itens com fornecedores diferentes. Selecione o fornecedor da compra." };
    }

    const fornecedor = state.fornecedores.find((f) => Number(f.id) === Number(fornecedorId));
    if (!fornecedor) return { ok: false, message: "Compra sem fornecedor associado (FK)." };

    const total = payload.itemsDetalhados.reduce((acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.preco) || 0), 0);
    const compraId = nextId("C");
    const compra = {
      id: compraId,
      data: payload.data || new Date().toISOString().split("T")[0],
      fornecedorId: fornecedor.id,
      fornecedor: fornecedor.nome,
      usuarioResponsavelId: state.currentUser?.id || null,
      usuarioResponsavel: state.currentUser?.login || "sistema",
      items: payload.itemsDetalhados.length,
      total,
      status: "Concluida",
    };
    const itemCompras = payload.itemsDetalhados.map((item) => ({
      id: nextId("IC"),
      compraId,
      produtoId: Number(item.produtoId),
      qtd: Number(item.quantidade) || 0,
      valorUnitario: Number(item.preco) || 0,
    }));

    setState((prev) => ({
      ...prev,
      compras: [compra, ...prev.compras],
      itemCompras: [...itemCompras, ...prev.itemCompras],
      produtos: prev.produtos.map((p) => (updates.has(p.id) ? { ...p, estoque: p.estoque + updates.get(p.id), quantidade: p.estoque + updates.get(p.id) } : p)),
      contasPagar: [
        { id: nextId("CP"), valor: total, vencimento: addDays(compra.data, 30), tipo: "compra", compraId: compraId, fornecedorId: fornecedor.id, fornecedor: fornecedor.nome, status: "Pendente" },
        ...prev.contasPagar,
      ],
    }));
    addLog("REGISTRAR_COMPRA", `Compra ${compraId} de fornecedor ${fornecedor.id}`);
    return { ok: true };
  };

  const upsertFinanceiro = (payload) => {
    const isReceber = payload.tipoConta === "receber";
    const key = isReceber ? "contasReceber" : "contasPagar";
    const baseId = isReceber ? "CR" : "CP";

    if (isReceber && !payload.clienteId) return { ok: false, message: "Conta a receber exige cliente (FK)." };
    if (!isReceber && !payload.tipo) return { ok: false, message: "Conta a pagar exige tipo." };
    if (!isReceber && payload.tipo.toLowerCase() === "compra" && !payload.compraId) return { ok: false, message: "Conta a pagar de compra exige compra (FK)." };

    const entity = { ...payload };
    delete entity.tipoConta;
    entity.valor = Number(entity.valor) || 0;

    if (isReceber) {
      const cliente = state.clientes.find((c) => Number(c.id) === Number(entity.clienteId));
      entity.cliente = cliente?.nome || entity.cliente;
    } else {
      if (entity.compraId) {
        const compra = state.compras.find((c) => String(c.id) === String(entity.compraId));
        if (compra) {
          entity.fornecedorId = compra.fornecedorId;
          entity.fornecedor = compra.fornecedor;
        }
      }
    }

    setState((prev) => {
      const isEdit = Boolean(entity.id);
      if (isEdit) return { ...prev, [key]: prev[key].map((item) => (item.id === entity.id ? { ...item, ...entity } : item)) };
      return { ...prev, [key]: [{ ...entity, id: nextId(baseId), status: entity.status || "Pendente" }, ...prev[key]] };
    });
    addLog("ATUALIZAR_FINANCEIRO", `${isReceber ? "receber" : "pagar"} id=${entity.id || "novo"}`);
    return { ok: true };
  };

  const value = useMemo(
    () => ({
      hydrated,
      ...state,
      canAccess,
      canEdit,
      login,
      logout,
      addLog,
      upsertCliente: (v) => upsertById("clientes", v, "CLIENTE"),
      upsertFornecedor: (v) => upsertById("fornecedores", v, "FORNECEDOR"),
      upsertProduto,
      removeCliente,
      removeFornecedor,
      removeProduto,
      removeUsuario,
      upsertUsuario,
      registerVenda,
      registerCompra,
      upsertFinanceiro,
      setContasReceber: (fn) => setState((prev) => ({ ...prev, contasReceber: fn(prev.contasReceber) })),
      setContasPagar: (fn) => setState((prev) => ({ ...prev, contasPagar: fn(prev.contasPagar) })),
      clearAllData: () => setState(defaultState),
    }),
    [hydrated, state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
