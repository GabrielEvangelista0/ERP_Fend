# Integração Frontend-Backend

## ✅ Configuração Completa

O frontend foi integrado com sucesso ao backend Express.js. A comunicação agora ocorre via HTTP/REST com autenticação JWT.

## 📋 Como Usar

### 1. Iniciar o Backend
```bash
cd backEnd
npm run dev
```
Rodará em `http://localhost:4000/api`

### 2. Iniciar o Frontend
```bash
cd front-end
npm run dev
```
Rodará em `http://localhost:3000`

### 3. Login padrão (criado na seed do banco)
```
Usuário: admin
Senha: admin123
Tipo: admin
```

Ou:
```
Usuário: operador
Senha: operador123
Tipo: operador
```

## 🔧 Arquivos Modificados

### Frontend

#### `.env.local` *(novo)*
Configuração da URL do backend (port 4000).

#### `src/utils/api.js` *(novo)*
Utilitário com funções para fazer requisições autenticadas ao backend. Inclui:
- `loginAPI()` - Autenticação
- `getClientesAPI(), createClienteAPI()`, etc - CRUD de clientes
- `getFornecedoresAPI()`, `getProdutosAPI()` - CRUD de fornecedores e produtos
- `getVendasAPI(), createVendaAPI()` - Vendas
- `getComprasAPI(), createCompraAPI()` - Compras  
- `getContasReceberAPI(), getContasPagarAPI()` - Financeiro
- Funções de relatórios (`relatorioVendasAPI()`, etc)

#### `src/providers/AppProvider.js` *(modificado)*
Refatorado para integração com backend:
- `login()` - Agora chama `loginAPI()` do backend em vez de verificar localmente
- `logout()` - Remove token do localStorage
- `syncDataFromBackend()` - Nova função que sincroniza clientes, fornecedores, produtos, vendas, compras e contas do backend
- Token JWT armazenado em `localStorage` com chave `erp_token`

## 🔐 Fluxo de Autenticação

1. Usuário entra com login/senha na página de login
2. `LoginPage` chama `login()` do AppProvider
3. AppProvider faz requisição POST para `/api/auth/login` no backend
4. Backend valida e retorna JWT token + informações do usuário
5. Token é salvo em `localStorage.erp_token`
6. `syncDataFromBackend()` carrega dados do backend
7. Usuário é autenticado e redirecionado para dashboard

## 📡 Headers de Requisição

Todas as requisições da API incluem automaticamente:
```javascript
Authorization: Bearer {token}
Content-Type: application/json
```

## 🗂️ Mapeamento de Tipos de Usuário

| Backend | Frontend |
|---------|----------|
| `admin` | `administrador` |
| `operador` | `operador` |
| `gerente` | `gerente` |

## ⚠️ Fallback para Modo Offline

O frontend ainda mantém dados locais como fallback. Se o backend não estiver disponível:
- Dados mock são carregados automaticamente
- Login usa verificação local (compatibilidade)
- Dados não são persistidos no backend

## 🧪 Testando a Integração

### 1. Verificar Connection Health
```bash
# No terminal do backend
curl http://localhost:4000/api
# Resposta esperada: "ERP Backend API"
```

### 2. Testar Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","senha":"admin123"}'
```

### 3. Acessar dados com Token
```bash
curl http://localhost:4000/api/clientes \
  -H "Authorization: Bearer {token_recebido}"
```

## 📦 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar novo usuário

### Dados
- `GET /api/clientes` - Listar clientes
- `GET /api/fornecedores` - Listar fornecedores
- `GET /api/produtos` - Listar produtos
- `GET /api/vendas` - Listar vendas
- `GET /api/compras` - Listar compras
- `GET /api/financeiro/contas-receber` - Contas a receber
- `GET /api/financeiro/contas-pagar` - Contas a pagar

### Relatórios
- `GET /api/relatorios/vendas` - Relatório de vendas
- `GET /api/relatorios/estoque` - Relatório de estoque
- `GET /api/relatorios/financeiro` - Resumo financeiro
- `GET /api/relatorios/logs` - Auditoria

## 🚀 Proximas Melhorias Opcionais

1. **Validação de Requisições** - Adicionar `joi` ou `express-validator`
2. **Rate Limiting** - Implementar limitador de requisições
3. **Request Logging** - Logs detalhados de requisições HTTP
4. **Notificações de Erro** - Toast/notifications para erros da API
5. **Refresh Token** - Implementar token refresh automático
6. **CORS Configuration** - Adicionar CORS headers ajustados ao backend

## ⚙️ Variáveis de Ambiente

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Backend (`.env`)
```
DATABASE_URL=postgres://postgres:1234@localhost:5432/erp_db
JWT_SECRET=seu_secret_aqui
PORT=4000
NODE_ENV=development
```

## 🐛 Troubleshooting

**"Failed to fetch"**
- Backend não está rodando em `http://localhost:4000`
- Verifique: `npm run dev` no diretório `backEnd`

**"Erro de autenticação"**
- Token expirou (24 horas)
- Faça login novamente

**"Dados não carregam"**
- Verifique se o usuário tem permissão (`canAccess()`)
- Verifique logs do backend para erros HTTP

**"CORS error"**
- Frontend e backend em diferentes origens
- Adicione CORS headers no backend:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});
```
