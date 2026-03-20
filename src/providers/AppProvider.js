"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clientes as clientesBase } from "@/data/clientes";
import { fornecedores as fornecedoresBase } from "@/data/fornecedores";
import { produtos as produtosBase } from "@/data/produtos";
import { vendas as vendasBase } from "@/data/vendas";
import { compras as comprasBase } from "@/data/compras";
import { contasPagar as contasPagarBase, contasReceber as contasReceberBase } from "@/data/financeiro";
import { usuarios as usuariosBase } from "@/data/usuarios";
import { parseCurrency } from "@/utils/currency";
import {
  createClienteAPI,
  createCompraAPI,
  createContaPagarAPI,
  createContaReceberAPI,
  createFornecedorAPI,
  createProdutoAPI,
  createVendaAPI,
  deleteClienteAPI,
  deleteFornecedorAPI,
  deleteProdutoAPI,
  deleteUsuarioAPI,
  getClientesAPI,
  getComprasAPI,
  getContasPagarAPI,
  getContasReceberAPI,
  getFornecedoresAPI,
  getProdutosAPI,
  getUsuariosAPI,
  getVendasAPI,
  loginAPI,
  meAPI,
  registerAPI,
  updateClienteAPI,
  updateContaPagarAPI,
  updateContaReceberAPI,
  updateFornecedorAPI,
  updateProdutoAPI,
  updateUsuarioAPI,
} from "@/utils/api";

const STORAGE_KEY = "erp_state_v3";
const TOKEN_KEY = "erp_token";
const AppContext = createContext(null);

// Define os módulos que cada tipo de usuário pode acessar
const modulesByRole = {
  administrador: ["dashboard", "clientes", "fornecedores", "produtos", "vendas", "compras", "financeiro", "relatorios", "usuarios", "logs"],
  operador: ["dashboard", "clientes", "produtos", "vendas"],
  gerente: ["dashboard", "clientes", "fornecedores", "produtos", "vendas", "compras", "financeiro", "relatorios"],
};

// Estado inicial padrão da aplicação com dados mock
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

// Converte o tipo de função do backend (admin) para a aplicação (administrador)
function mapRoleFromApi(role) {
  return role === "admin" ? "administrador" : role;
}

// Converte o tipo de função da aplicação (administrador) para o backend (admin)
function mapRoleToApi(role) {
  return role === "administrador" ? "admin" : role;
}

// Formata status de conta a pagar/receber para exibição
function formatStatus(status) {
  if (!status) return "Pendente";
  return status.toLowerCase() === "pago" ? "Pago" : "Pendente";
}

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // ==================== FUNÇÕES AUXILIARES ====================

  /**
   * addLog - Registra uma ação do usuário no sistema de logs
   * @param {string} acao - Tipo de ação realizada (ex: CADASTRAR_CLIENTE, ATUALIZAR_PRODUTO)
   * @param {string} detalhes - Detalhes adicionais sobre a ação
   */
  const addLog = (acao, detalhes = "") => {
    setState((prev) => ({
      ...prev,
      logs: [
        { id: `LOG-${Date.now()}`, dataHora: new Date().toISOString(), usuario: prev.currentUser?.login || "sistema", acao, detalhes },
        ...prev.logs,
      ],
    }));
  };

  /**
   * canAccess - Verifica se o usuário pode acessar um módulo específico
   * @param {string} moduleName - Nome do módulo (ex: 'clientes', 'produtos', 'usuarios')
   * @returns {boolean} true se pode acessar, false caso contrário
   */
  const canAccess = (moduleName) => {
    if (!state.currentUser) return false;
    return (modulesByRole[state.currentUser.tipo] || []).includes(moduleName);
  };

  /**
   * canEdit - Verifica se o usuário pode editar um módulo específico
   * Cada tipo de usuário tem permissões diferentes:
   * - Admin: pode editar tudo
   * - Operador: pode editar tudo menos usuários e logs
   * - Gerente: pode editar apenas financeiro
   * @param {string} moduleName - Nome do módulo
   * @returns {boolean} true se pode editar, false caso contrário
   */
  const canEdit = (moduleName) => {
    if (!state.currentUser) return false;
    if (state.currentUser.tipo === "administrador") return true;
    if (state.currentUser.tipo === "operador") return moduleName !== "usuarios" && moduleName !== "logs";
    if (state.currentUser.tipo === "gerente") return moduleName === "financeiro";
    return false;
  };

  /**
   * syncDataFromBackend - Sincroniza todos os dados do backend com o estado local
   * Faz requisições para buscar clientes, fornecedores, produtos, vendas, compras, etc
   * e mapeia os dados para o formato esperado pela aplicação.
   * É chamada após login, ao criar/editar/deletar dados, e periodicamente a cada 30s
   */
  const syncDataFromBackend = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return;

    try {
      const [clientesRes, fornecedoresRes, produtosRes, vendasRes, comprasRes, contasReceberRes, contasPagarRes, usuariosRes] = await Promise.all([
        getClientesAPI(),
        getFornecedoresAPI(),
        getProdutosAPI(),
        getVendasAPI(),
        getComprasAPI(),
        getContasReceberAPI(),
        getContasPagarAPI(),
        getUsuariosAPI(),
      ]);

      setState((prevState) => {
        const newState = { ...prevState };

        if (clientesRes.ok && Array.isArray(clientesRes.data)) {
          newState.clientes = clientesRes.data.map((c) => ({
            id: c.id,
            nome: c.nome,
            telefone: c.telefone,
            endereco: c.endereco,
          }));
        }

        if (fornecedoresRes.ok && Array.isArray(fornecedoresRes.data)) {
          newState.fornecedores = fornecedoresRes.data.map((f) => ({
            id: f.id,
            nome: f.nome,
            telefone: f.telefone,
            endereco: f.endereco,
          }));
        }

        if (produtosRes.ok && Array.isArray(produtosRes.data)) {
          newState.produtos = produtosRes.data.map((p) => ({
            id: p.id,
            codigo: p.codigo,
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            preco: Number(p.preco),
            quantidade: Number(p.quantidade),
            estoque: Number(p.quantidade),
            fornecedorId: p.fornecedor_id,
            fornecedor: p.fornecedor_nome || "",
          }));
        }

        if (vendasRes.ok && Array.isArray(vendasRes.data)) {
          newState.vendas = vendasRes.data.map((v) => ({
            id: v.id,
            data: v.data,
            clienteId: v.cliente_id,
            cliente: v.cliente_nome,
            usuarioResponsavelId: v.usuario_id,
            usuarioResponsavel: v.usuario_nome || "",
            items: Number(v.quantidade_itens || 0),
            total: Number(v.total),
            status: "Concluida",
          }));
        }

        if (comprasRes.ok && Array.isArray(comprasRes.data)) {
          newState.compras = comprasRes.data.map((c) => ({
            id: c.id,
            data: c.data,
            fornecedorId: c.fornecedor_id,
            fornecedor: c.fornecedor_nome,
            usuarioResponsavelId: c.usuario_id,
            usuarioResponsavel: c.usuario_nome || "",
            items: Number(c.quantidade_itens || 0),
            total: Number(c.total),
            status: "Concluida",
          }));
        }

        if (contasReceberRes.ok && Array.isArray(contasReceberRes.data)) {
          newState.contasReceber = contasReceberRes.data.map((c) => ({
            id: c.id,
            valor: Number(c.valor),
            vencimento: c.data_vencimento,
            clienteId: c.cliente_id,
            cliente: c.cliente_nome,
            vendaId: c.venda_id,
            status: formatStatus(c.status),
          }));
        }

        if (contasPagarRes.ok && Array.isArray(contasPagarRes.data)) {
          newState.contasPagar = contasPagarRes.data.map((c) => ({
            id: c.id,
            valor: Number(c.valor),
            vencimento: c.data_vencimento,
            tipo: c.tipo || "compra",
            compraId: c.compra_id,
            fornecedorId: c.fornecedor_id,
            fornecedor: c.fornecedor_nome,
            status: formatStatus(c.status),
          }));
        }

        if (usuariosRes.ok && Array.isArray(usuariosRes.data)) {
          newState.usuarios = usuariosRes.data.map((u) => ({
            id: u.id,
            login: u.login,
            nome: u.nome,
            email: u.email,
            tipo: mapRoleFromApi(u.tipo),
            ativo: u.ativo,
          }));
        }

        return newState;
      });
    } catch (error) {
      console.error("[syncDataFromBackend] erro:", error);
    }
  };

  /**
   * login - Autentica um usuário no sistema
   * Faz requisição ao backend com credenciais, recebe token JWT e dados do usuário
   * Armazena token no localStorage para requisições futuras
   * @param {string} loginName - Nome de usuário ou email
   * @param {string} senha - Senha do usuário
   * @returns {object} { ok: boolean, message?: string }
   */
  const login = async (loginName, senha) => {
    try {
      const result = await loginAPI(loginName, senha);
      if (!result.ok) return { ok: false, message: result.message || "Falha ao fazer login" };

      const token = result.data.token;
      const user = result.data.user;

      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(STORAGE_KEY);
      }

      setState((prev) => ({
        ...prev,
        currentUser: {
          id: user.id,
          nome: user.nome,
          login: user.login,
          tipo: mapRoleFromApi(user.tipo || "operador"),
          token,
        },
      }));

      // NÃO chamar syncDataFromBackend aqui - será chamado pelo useEffect abaixo
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || "Erro ao fazer login" };
    }
  };

  /**
   * logout - Encerra a sessão do usuário
   * Remove token do localStorage, limpa currentUser, e registra ação de logout nos logs
   */
  const logout = () => {
    const who = state.currentUser?.login;
    setState((prev) => ({ ...prev, currentUser: null }));
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    if (who) setTimeout(() => addLog("LOGOUT", `Sessao encerrada por ${who}`), 0);
  };

  // ==================== EFEITOS COLATERAIS ====================

  /**
   * useEffect: Inicialização e hidratação do estado
   * - Carrega dados armazenados do localStorage (estado local)
   * - Valida token JWT existente e restaura sessão do usuário
   * - Se houver token válido, busca dados atualizados do usuário (meAPI)
   * - Remove token expirado do localStorage
   * - Define flag hydrated = true para sinalizar conclusão da inicialização
   */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setState((prev) => ({ ...prev, ...parsed }));
      } catch {
        setState(defaultState);
      }
    }

    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (token) {
      (async () => {
        try {
          const me = await meAPI();
          if (me.ok && me.data?.user) {
            const user = me.data.user;
            setState((prev) => ({
              ...prev,
              currentUser: {
                id: user.id,
                nome: user.nome,
                login: user.login,
                tipo: mapRoleFromApi(user.tipo || "operador"),
                token,
              },
            }));
            // NÃO chamar syncDataFromBackend aqui - será chamado pelo useEffect abaixo
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      })();
    }

    setHydrated(true);
  }, []);

  /**
   * useEffect: Persistência de estado no localStorage
   * Sempre que o estado muda e a componente foi inicializada (hydrated),
   * salva o estado inteiro no localStorage para recuperação em futuras sessões
   */
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  /**
   * useEffect: Sincronização inicial de dados
   * Triggerado quando usuário faz login (currentUser?.id muda)
   * Busca todos os dados do backend para sincronizar com estado local
   */
  useEffect(() => {
    if (!hydrated || !state.currentUser) return;
    console.debug('[AppProvider] useEffect detectou novo currentUser, chamando syncDataFromBackend');
    syncDataFromBackend();
  }, [state.currentUser?.id, hydrated]);

  /**
   * useEffect: Auto-sincronização periódica e por foco de aba
   * - Sincroniza dados a cada 30 segundos enquanto usuário estiver logado
   * - Sincroniza imediatamente quando usuário muda de aba (ganha foco)
   * - Limpa interval e listener ao deslogar
   */
  useEffect(() => {
    if (!state.currentUser) return;

    const autoSyncInterval = setInterval(() => {
      syncDataFromBackend();
    }, 30000); // 30 segundos

    // Sincroniza ao ganhar foco na aba
    const handleFocus = () => syncDataFromBackend();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(autoSyncInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.currentUser]);

  // ==================== OPERAÇÕES CRUD - CLIENTES E FORNECEDORES ====================

  /**
   * upsertCliente - Cria ou atualiza um cliente
   * Detecta automaticamente se é criação ou edição baseado na presença do ID
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {object} cliente - { id?, nome, telefone, endereco }
   * @returns {object} { ok: boolean, message?: string }
   */
  const upsertCliente = async (cliente) => {
    const isEdit = Boolean(cliente.id);
    const result = isEdit
      ? await updateClienteAPI(cliente.id, cliente.nome, cliente.telefone, cliente.endereco)
      : await createClienteAPI(cliente.nome, cliente.telefone, cliente.endereco);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel salvar cliente." };
    await syncDataFromBackend();
    addLog(isEdit ? "ATUALIZAR_CLIENTE" : "CADASTRAR_CLIENTE", cliente.nome || "");
    return { ok: true };
  };

  /**
   * upsertFornecedor - Cria ou atualiza um fornecedor
   * Detecta automaticamente se é criação ou edição baseado na presença do ID
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {object} fornecedor - { id?, nome, telefone, endereco }
   * @returns {object} { ok: boolean, message?: string }
   */
  const upsertFornecedor = async (fornecedor) => {
    const isEdit = Boolean(fornecedor.id);
    const result = isEdit
      ? await updateFornecedorAPI(fornecedor.id, fornecedor.nome, fornecedor.telefone, fornecedor.endereco)
      : await createFornecedorAPI(fornecedor.nome, fornecedor.telefone, fornecedor.endereco);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel salvar fornecedor." };
    await syncDataFromBackend();
    addLog(isEdit ? "ATUALIZAR_FORNECEDOR" : "CADASTRAR_FORNECEDOR", fornecedor.nome || "");
    return { ok: true };
  };

  // ==================== OPERAÇÕES CRUD - PRODUTOS ====================

  /**
   * upsertProduto - Cria ou atualiza um produto
   * Valida que o produto possui fornecedorId (chave estrangeira obrigatória)
   * Detecta automaticamente se é criação ou edição baseado na presença do ID
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {object} produto - { id?, codigo, nome, descricao, categoria, preco, quantidade/estoque, fornecedorId }
   * @returns {object} { ok: boolean, message?: string }
   */
  const upsertProduto = async (produto) => {
    if (!produto.fornecedorId) return { ok: false, message: "Produto deve possuir fornecedor (FK)." };
    const isEdit = Boolean(produto.id);
    const result = isEdit
      ? await updateProdutoAPI(
          produto.id,
          produto.codigo,
          produto.nome,
          produto.descricao,
          produto.categoria,
          produto.preco,
          produto.quantidade ?? produto.estoque,
          produto.fornecedorId
        )
      : await createProdutoAPI(
          produto.codigo,
          produto.nome,
          produto.descricao,
          produto.categoria,
          produto.preco,
          produto.quantidade ?? produto.estoque,
          produto.fornecedorId
        );
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel salvar produto." };
    await syncDataFromBackend();
    addLog(isEdit ? "ATUALIZAR_PRODUTO" : "CADASTRAR_PRODUTO", produto.nome || "");
    return { ok: true };
  };

  /**
   * removeCliente - Deleta um cliente do sistema
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {number} id - ID do cliente a ser removido
   * @returns {object} { ok: boolean, message?: string }
   */
  const removeCliente = async (id) => {
    const result = await deleteClienteAPI(id);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel remover cliente." };
    await syncDataFromBackend();
    addLog("REMOVER_CLIENTE", `CLIENTE id=${id}`);
    return { ok: true };
  };

  /**
   * removeFornecedor - Deleta um fornecedor do sistema
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {number} id - ID do fornecedor a ser removido
   * @returns {object} { ok: boolean, message?: string }
   */
  const removeFornecedor = async (id) => {
    const result = await deleteFornecedorAPI(id);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel remover fornecedor." };
    await syncDataFromBackend();
    addLog("REMOVER_FORNECEDOR", `FORNECEDOR id=${id}`);
    return { ok: true };
  };

  /**
   * removeProduto - Deleta um produto do sistema
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {number} id - ID do produto a ser removido
   * @returns {object} { ok: boolean, message?: string }
   */
  const removeProduto = async (id) => {
    const result = await deleteProdutoAPI(id);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel remover produto." };
    await syncDataFromBackend();
    addLog("REMOVER_PRODUTO", `PRODUTO id=${id}`);
    return { ok: true };
  };

  /**
   * upsertUsuario - Cria ou atualiza um usuário do sistema
   * Mapeia o tipo de usuário (operador/gerente/administrador) para formato de API
   * Detecta automaticamente se é criação ou edição baseado na presença do ID
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {object} usuario - { id?, login, senha?, nome, email, tipo }
   * @returns {object} { ok: boolean, message?: string }
   */
  const upsertUsuario = async (usuario) => {
    const isEdit = Boolean(usuario.id);
    const role = mapRoleToApi(usuario.tipo || "operador");
    const result = isEdit
      ? await updateUsuarioAPI(usuario.id, usuario.nome, role)
      : await registerAPI(usuario.login, usuario.senha, usuario.nome, role, usuario.email || `${usuario.login}@erp.local`);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel salvar usuario." };
    await syncDataFromBackend();
    addLog(isEdit ? "ATUALIZAR_USUARIO" : "CADASTRAR_USUARIO", usuario.login || "");
    return { ok: true };
  };

  /**
   * removeUsuario - Deleta um usuário do sistema
   * Protege contra auto-exclusão do usuário logado
   * Após sucesso, sincroniza todos os dados do backend e registra ação nos logs
   * @param {number} id - ID do usuário a ser removido
   * @returns {object} { ok: boolean, message?: string }
   */
  const removeUsuario = async (id) => {
    if (Number(state.currentUser?.id) === Number(id)) {
      return { ok: false, message: "Nao e permitido remover o usuario logado." };
    }
    const result = await deleteUsuarioAPI(id);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel remover usuario." };
    await syncDataFromBackend();
    addLog("REMOVER_USUARIO", `USUARIO id=${id}`);
    return { ok: true };
  };

  // ==================== OPERAÇÕES CRUD - VENDAS E COMPRAS ====================

  /**
   * registerVenda - Registra uma nova venda no sistema
   * Valida que a venda possui cliente (FK) e itens detalhados
   * Envia todos os itens em um único request ao backend
   * Após sucesso, sincroniza todos os dados e atualiza gráficos
   * @param {object} payload - { clienteId, itemsDetalhados: [{ produtoId, quantidade, preco_unitario }, ...] }
   * @returns {object} { ok: boolean, message?: string }
   */
  const registerVenda = async (payload) => {
    if (!payload.clienteId) return { ok: false, message: "Venda sem cliente associado (FK)." };
    if (!payload.itemsDetalhados?.length) return { ok: false, message: "Venda sem itens." };
    const result = await createVendaAPI(payload.clienteId, payload.itemsDetalhados);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel registrar venda." };
    await syncDataFromBackend();
    addLog("REGISTRAR_VENDA", `cliente=${payload.clienteId}`);
    return { ok: true };
  };

  /**
   * registerCompra - Registra uma nova compra no sistema
   * Valida que a compra possui fornecedor (FK) e itens detalhados
   * Envia todos os itens em um único request ao backend
   * Após sucesso, sincroniza todos os dados
   * @param {object} payload - { fornecedorId, itemsDetalhados: [{ produtoId, quantidade, preco_unitario }, ...] }
   * @returns {object} { ok: boolean, message?: string }
   */
  const registerCompra = async (payload) => {
    if (!payload.fornecedorId) return { ok: false, message: "Compra sem fornecedor associado (FK)." };
    if (!payload.itemsDetalhados?.length) return { ok: false, message: "Compra sem itens." };
    const result = await createCompraAPI(payload.fornecedorId, payload.itemsDetalhados);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel registrar compra." };
    await syncDataFromBackend();
    addLog("REGISTRAR_COMPRA", `fornecedor=${payload.fornecedorId}`);
    return { ok: true };
  };

  // ==================== OPERAÇÕES CRUD - FINANCEIRO ====================

  /**
   * upsertFinanceiro - Cria uma conta receber ou pagar
   * Edição de contas ainda não está disponível (retorna erro)
   * Para Conta a Receber: requer clienteId
   * Para Conta a Pagar: requer compraId (que determina o fornecedorId) ou fornecedorId direto
   * Após sucesso, sincroniza todos os dados
   * @param {object} payload - { tipoConta, id?, clienteId?, fornecedorId?, compraId?, valor, vencimento, tipo? }
   * @returns {object} { ok: boolean, message?: string }
   */
  const upsertFinanceiro = async (payload) => {
    const isReceber = payload.tipoConta === "receber";
    if (payload.id) {
      return { ok: false, message: "Edicao completa de conta ainda nao esta disponivel via API." };
    }

    if (isReceber) {
      if (!payload.clienteId) return { ok: false, message: "Conta a receber exige cliente (FK)." };
      const result = await createContaReceberAPI(payload.clienteId, payload.valor, payload.vencimento);
      if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel criar conta a receber." };
    } else {
      const compra = state.compras.find((c) => String(c.id) === String(payload.compraId));
      const fornecedorId = compra?.fornecedorId || payload.fornecedorId;
      if (!fornecedorId) return { ok: false, message: "Selecione uma compra vinculada ao fornecedor." };
      const result = await createContaPagarAPI(fornecedorId, payload.valor, payload.tipo || "compra", payload.vencimento);
      if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel criar conta a pagar." };
    }

    await syncDataFromBackend();
    addLog("ATUALIZAR_FINANCEIRO", `${isReceber ? "receber" : "pagar"} novo`);
    return { ok: true };
  };

  /**
   * markContaReceberAsPaid - Marca uma conta receber como paga
   * Define a data de pagamento como hoje
   * Após sucesso, sincroniza todos os dados
   * @param {number} id - ID da conta a receber
   * @returns {object} { ok: boolean, message?: string }
   */
  const markContaReceberAsPaid = async (id) => {
    const today = new Date().toISOString().split("T")[0];
    const result = await updateContaReceberAPI(id, today);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel registrar pagamento." };
    await syncDataFromBackend();
    return { ok: true };
  };

  /**
   * markContaPagarAsPaid - Marca uma conta pagar como paga
   * Define a data de pagamento como hoje
   * Após sucesso, sincroniza todos os dados
   * @param {number} id - ID da conta a pagar
   * @returns {object} { ok: boolean, message?: string }
   */
  const markContaPagarAsPaid = async (id) => {
    const today = new Date().toISOString().split("T")[0];
    const result = await updateContaPagarAPI(id, today);
    if (!result.ok) return { ok: false, message: result.message || "Nao foi possivel registrar pagamento." };
    await syncDataFromBackend();
    return { ok: true };
  };

  // ==================== CONTEXTO E RETORNO DO PROVIDER ====================

  /**
   * value (useMemo) - Objeto de contexto memoizado
   * Contém todo o estado da aplicação e funções de operação
   * Usa useMemo para otimizar performance e evitar re-renders desnecessários
   * 
   * Propriedades de estado:
   * - hydrated: boolean - indica se a inicialização foi concluída
   * - currentUser: object - usuário logado com tipo de acesso
   * - clientes, fornecedores, produtos, vendas, compras: arrays de dados
   * - contasReceber, contasPagar: arrays de contas financeiras
   * - usuarios: array de usuários do sistema
   * - logs: array de ações registradas no sistema
   *
   * Métodos de autorização:
   * - canAccess(moduleName): verifica se usuário pode visualizar módulo
   * - canEdit(moduleName): verifica se usuário pode editar módulo
   *
   * Métodos de autenticação:
   * - login(loginName, senha): autentica usuário
   * - logout(): encerra sessão
   *
   * Métodos de sincronização:
   * - syncDataFromBackend(): busca todos os dados do servidor
   * - addLog(acao, detalhes): registra ação do usuário
   *
   * Métodos de clientes:
   * - upsertCliente(cliente): criar/editar cliente
   * - removeCliente(id): deletar cliente
   *
   * Métodos de fornecedores:
   * - upsertFornecedor(fornecedor): criar/editar fornecedor
   * - removeFornecedor(id): deletar fornecedor
   *
   * Métodos de produtos:
   * - upsertProduto(produto): criar/editar produto
   * - removeProduto(id): deletar produto
   *
   * Métodos de usuários:
   * - upsertUsuario(usuario): criar/editar usuário
   * - removeUsuario(id): deletar usuário
   *
   * Métodos de vendas e compras:
   * - registerVenda(payload): registra venda com itens
   * - registerCompra(payload): registra compra com itens
   *
   * Métodos de financeiro:
   * - upsertFinanceiro(payload): cria conta receber ou pagar
   * - markContaReceberAsPaid(id): marca conta como paga
   * - markContaPagarAsPaid(id): marca conta como paga
   *
   * Métodos de estado direto:
   * - setContasReceber(fn): atualiza array de contas a receber
   * - setContasPagar(fn): atualiza array de contas a pagar
   * - clearAllData(): limpa todos os dados (logout)
   */
  const value = useMemo(
    () => ({
      hydrated,
      ...state,
      canAccess,
      canEdit,
      login,
      logout,
      syncDataFromBackend,
      addLog,
      upsertCliente,
      upsertFornecedor,
      upsertProduto,
      removeCliente,
      removeFornecedor,
      removeProduto,
      removeUsuario,
      upsertUsuario,
      registerVenda,
      registerCompra,
      upsertFinanceiro,
      markContaReceberAsPaid,
      markContaPagarAsPaid,
      setContasReceber: (fn) => setState((prev) => ({ ...prev, contasReceber: fn(prev.contasReceber) })),
      setContasPagar: (fn) => setState((prev) => ({ ...prev, contasPagar: fn(prev.contasPagar) })),
      clearAllData: () => setState(defaultState),
    }),
    [hydrated, state]
  );

  /**
   * Renderiza o AppContext.Provider envolvendo os children
   * Toda a aplicação pode acessar o contexto via hook useApp()
   */
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * useApp - Hook para acessar o contexto da aplicação
 * Deve ser utilizado apenas dentro da subárvore envolvida pelo AppProvider
 * Lança erro se usado fora do contexto correto
 * @returns {object} Objeto de contexto da aplicação com todos os dados e funções
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
