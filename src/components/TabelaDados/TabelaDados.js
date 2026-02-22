import React from "react";
import "./TabelaDados.css";
import { formatCurrency } from "@/utils/currency";

const TabelaDados = ({ dados, tipo, onEdit, onDelete, onStatusChange }) => {
  const columnsByType = {
    cliente: ["id", "nome", "telefone", "endereco", "acoes"],
    fornecedor: ["id", "nome", "telefone", "endereco", "acoes"],
    produto: ["id", "codigo", "nome", "descricao", "categoria", "preco", "quantidade", "fornecedor", "acoes"],
    venda: ["id", "data", "cliente", "clienteId", "items", "total", "usuarioResponsavel"],
    compra: ["id", "data", "fornecedor", "fornecedorId", "items", "total", "usuarioResponsavel"],
    financeiro: ["id", "valor", "vencimento", "tipo", "compraId", "cliente", "status", "acoes"],
    usuario: ["nome", "login", "tipo", "acoes"],
    log: ["dataHora", "usuario", "acao", "detalhes"],
  };

  const headersByType = {
    cliente: ["ID", "Nome", "Telefone", "Endereco", "Acoes"],
    fornecedor: ["ID", "Nome", "Telefone", "Endereco", "Acoes"],
    produto: ["ID", "Codigo", "Nome", "Descricao", "Categoria", "Preco", "Quantidade", "Fornecedor", "Acoes"],
    venda: ["ID", "Data", "Cliente", "Cliente FK", "Itens", "Total", "Usuario"],
    compra: ["ID", "Data", "Fornecedor", "Fornecedor FK", "Itens", "Total", "Usuario"],
    financeiro: ["ID", "Valor", "Vencimento", "Tipo", "Compra FK", "Cliente", "Status", "Acoes"],
    usuario: ["Nome", "Login", "Perfil", "Acoes"],
    log: ["Data/Hora", "Usuario", "Acao", "Detalhes"],
  };

  const columns = columnsByType[tipo] || Object.keys(dados[0] || {});
  const headers = headersByType[tipo] || columns;

  const readValue = (obj, path) => {
    const v = obj[path];
    if (v == null) return "-";
    if (path === "valor" || path === "total" || path === "preco") return typeof v === "number" ? formatCurrency(v) : v;
    if (path === "dataHora") return new Date(v).toLocaleString("pt-BR");
    return v;
  };

  return (
    <table className="tabela">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dados.map((item, index) => (
          <tr key={item.id || index}>
            {columns.map((col) => {
              if (tipo === "financeiro" && col === "status") {
                const isPending = (item.status || "").toLowerCase() === "pendente";
                return (
                  <td key={`${index}-${col}`}>
                    {isPending ? (
                      <button
                        onClick={() => onStatusChange && onStatusChange({ ...item, status: "Pago" })}
                        className="px-3 py-1 bg-[#001A23] text-white rounded text-sm hover:bg-[#5386E4] cursor-pointer"
                      >
                        Confirmar pagamento
                      </button>
                    ) : (
                      <span className="text-gray-600 font-medium">{item.status}</span>
                    )}
                  </td>
                );
              }

              if (col === "acoes") {
                return (
                  <td key={`${index}-${col}`} className="flex gap-3">
                    {onEdit ? (
                      <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                        Editar
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 font-medium cursor-pointer">
                        Excluir
                      </button>
                    ) : null}
                  </td>
                );
              }

              return <td key={`${index}-${col}`}>{readValue(item, col)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TabelaDados;
