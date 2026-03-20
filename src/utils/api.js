/**
 * API Helper - Funções para fazer requisições autenticadas ao backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Recupera o token JWT do localStorage
function getToken() {
  if (typeof window === 'undefined') return null;
  // Prioriza token armazenado em chave dedicada
  const tokenDirect = localStorage.getItem('erp_token');
  if (tokenDirect) return tokenDirect;

  // Fallback: compatibilidade com chave antiga onde todo o estado era salvo
  const state = localStorage.getItem('erp_state_v3');
  try {
    const parsed = JSON.parse(state);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

// Cria headers com autenticação
function getHeaders(customHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// Função genérica para fazer requisições
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const customHeaders = options.headers || {};
  const mergedHeaders = getHeaders(customHeaders);

  if (options.body instanceof FormData) {
    delete mergedHeaders["Content-Type"];
  }

  const config = {
    ...options,
    headers: mergedHeaders,
  };

  try {
    const response = await fetch(url, config);
    const raw = await response.text();
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Erro ${response.status}`);
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

// ============ AUTENTICAÇÃO ============

export async function loginAPI(login, senha) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, senha }),
  });
  return result;
}

export async function meAPI() {
  return apiRequest('/auth/me', { method: 'GET' });
}

export async function registerAPI(login, senha, nome, tipo, email) {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login, senha, nome, tipo, email }),
  });
  return result;
}

// ============ CLIENTES ============

export async function getClientesAPI() {
  return apiRequest('/clientes');
}

export async function createClienteAPI(nome, telefone, endereco) {
  return apiRequest('/clientes', {
    method: 'POST',
    body: JSON.stringify({ nome, telefone, endereco }),
  });
}

export async function updateClienteAPI(id, nome, telefone, endereco) {
  return apiRequest(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, telefone, endereco }),
  });
}

export async function deleteClienteAPI(id) {
  return apiRequest(`/clientes/${id}`, { method: 'DELETE' });
}

// ============ FORNECEDORES ============

export async function getFornecedoresAPI() {
  return apiRequest('/fornecedores');
}

export async function createFornecedorAPI(nome, telefone, endereco) {
  return apiRequest('/fornecedores', {
    method: 'POST',
    body: JSON.stringify({ nome, telefone, endereco }),
  });
}

export async function updateFornecedorAPI(id, nome, telefone, endereco) {
  return apiRequest(`/fornecedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, telefone, endereco }),
  });
}

export async function deleteFornecedorAPI(id) {
  return apiRequest(`/fornecedores/${id}`, { method: 'DELETE' });
}

// ============ PRODUTOS ============

export async function getProdutosAPI() {
  return apiRequest('/produtos');
}

export async function createProdutoAPI(codigo, nome, descricao, categoria, preco, quantidade, fornecedor_id) {
  return apiRequest('/produtos', {
    method: 'POST',
    body: JSON.stringify({
      codigo,
      nome,
      descricao,
      categoria,
      preco: Number(preco),
      quantidade: Number(quantidade),
      fornecedor_id: Number(fornecedor_id),
    }),
  });
}

export async function updateProdutoAPI(id, codigo, nome, descricao, categoria, preco, quantidade, fornecedor_id) {
  return apiRequest(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      codigo,
      nome,
      descricao,
      categoria,
      preco: Number(preco),
      quantidade: Number(quantidade),
      fornecedor_id: Number(fornecedor_id),
    }),
  });
}

export async function deleteProdutoAPI(id) {
  return apiRequest(`/produtos/${id}`, { method: 'DELETE' });
}

// ============ VENDAS ============

export async function getVendasAPI() {
  return apiRequest('/vendas');
}

export async function createVendaAPI(cliente_id, items) {
  // items deve ser um array de { produto_id, quantidade, preco }
  return apiRequest('/vendas', {
    method: 'POST',
    body: JSON.stringify({
      cliente_id: Number(cliente_id),
      itens: items.map(item => ({
        produto_id: Number(item.produto_id || item.produtoId),
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario || item.preco),
      })),
    }),
  });
}

export async function deleteVendaAPI(id) {
  return apiRequest(`/vendas/${id}`, { method: 'DELETE' });
}

export async function getVendaItensAPI(id) {
  return apiRequest(`/vendas/${id}/itens`);
}

// ============ COMPRAS ============

export async function getComprasAPI() {
  return apiRequest('/compras');
}

export async function createCompraAPI(fornecedor_id, items) {
  // items deve ser um array de { produto_id, quantidade, preco }
  return apiRequest('/compras', {
    method: 'POST',
    body: JSON.stringify({
      fornecedor_id: Number(fornecedor_id),
      itens: items.map(item => ({
        produto_id: Number(item.produto_id || item.produtoId),
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario || item.preco),
      })),
    }),
  });
}

export async function deleteCompraAPI(id) {
  return apiRequest(`/compras/${id}`, { method: 'DELETE' });
}

export async function getCompraItensAPI(id) {
  return apiRequest(`/compras/${id}/itens`);
}

// ============ FINANCEIRO ============

export async function getContasReceberAPI() {
  return apiRequest("/financeiro/contas-receber");
}

export async function getContasPagarAPI() {
  return apiRequest("/financeiro/contas-pagar");
}

export async function createContaReceberAPI(cliente_id, valor, data_vencimento, observacoes = null) {
  return apiRequest("/financeiro/contas-receber", {
    method: "POST",
    body: JSON.stringify({
      cliente_id: Number(cliente_id),
      valor: Number(valor),
      data_vencimento,
      observacoes,
    }),
  });
}

export async function createContaPagarAPI(fornecedor_id, valor, tipo, data_vencimento, observacoes = null) {
  return apiRequest("/financeiro/contas-pagar", {
    method: "POST",
    body: JSON.stringify({
      fornecedor_id: Number(fornecedor_id),
      valor: Number(valor),
      tipo,
      data_vencimento,
      observacoes,
    }),
  });
}

export async function updateContaReceberAPI(id, data_pagamento) {
  return apiRequest(`/financeiro/contas-receber/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data_pagamento, status: "pago" }),
  });
}

export async function updateContaPagarAPI(id, data_pagamento) {
  return apiRequest(`/financeiro/contas-pagar/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data_pagamento, status: "pago" }),
  });
}

export async function getFluxoCaixaAPI(data_inicio, data_fim) {
  const params = new URLSearchParams();
  if (data_inicio) params.append('inicial', data_inicio);
  if (data_fim) params.append('final', data_fim);
  return apiRequest(`/financeiro/fluxo-caixa?${params.toString()}`);
}

// ============ RELATÓRIOS ============

export async function relatorioVendasAPI() {
  return apiRequest('/relatorios/vendas');
}

export async function relatorioVendasPorClienteAPI() {
  return apiRequest('/relatorios/vendas-por-cliente');
}

export async function relatorioEstoqueAPI() {
  return apiRequest('/relatorios/estoque');
}

export async function relatorioEstoqueBaixoAPI(quantidade = 10) {
  return apiRequest(`/relatorios/estoque-baixo?quantidade=${quantidade}`);
}

export async function relatorioFinanceiroAPI() {
  return apiRequest('/relatorios/financeiro');
}

export async function relatorioLogsAPI() {
  return apiRequest('/relatorios/logs');
}

export async function relatorioLogsUsuarioAPI(usuario_id) {
  return apiRequest(`/relatorios/logs/${usuario_id}`);
}

// ============ USUÁRIOS ============

export async function getUsuariosAPI() {
  return apiRequest('/usuarios');
}

export async function updateUsuarioAPI(id, nome, tipo) {
  return apiRequest(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome, tipo }),
  });
}

export async function deleteUsuarioAPI(id) {
  return apiRequest(`/usuarios/${id}`, { method: 'DELETE' });
}
