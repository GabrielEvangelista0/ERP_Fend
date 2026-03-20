"use client";

import { useEffect, useState } from "react";
import { getVendaItensAPI, getCompraItensAPI } from "@/utils/api";
import { formatCurrency } from "@/utils/currency";
import "./DetalhesVendaCompra.css";

export default function DetalhesVendaCompra({ open, onClose, tipo, dados }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !dados?.id) {
      setItens([]);
      setError(null);
      return;
    }

    const fetchItens = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = tipo === "venda" 
          ? await getVendaItensAPI(dados.id)
          : await getCompraItensAPI(dados.id);

        if (result.ok) {
          setItens(Array.isArray(result.data) ? result.data : []);
        } else {
          setError(result.message || "Erro ao carregar itens");
        }
      } catch (err) {
        setError("Erro ao carregar itens");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItens();
  }, [open, dados?.id, tipo]);

  if (!open) return null;

  const totalItens = itens.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
  const totalCalculado = itens.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#001A23] text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {tipo === "venda" ? "Detalhes da Venda" : "Detalhes da Compra"}
            </h2>
            <p className="text-sm text-gray-300">ID: {dados?.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-red-400 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase">Data</p>
              <p className="text-lg font-semibold text-gray-800">
                {dados?.data ? new Date(dados.data).toLocaleDateString("pt-BR") : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">
                {tipo === "venda" ? "Cliente" : "Fornecedor"}
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {tipo === "venda" ? dados?.cliente : dados?.fornecedor}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Usuário Responsável</p>
              <p className="text-lg font-semibold text-gray-800">
                {dados?.usuarioResponsavel || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <p className="text-lg font-semibold text-green-600">
                {dados?.status || "Concluída"}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Itens ({tipo === "venda" ? "Item Venda" : "Item Compra"})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Carregando itens...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : itens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum item encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-3 text-left font-semibold text-gray-700">Produto</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Qtd</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Preço Unit.</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-gray-800">
                          <div className="font-medium">{item.produto_nome}</div>
                          <div className="text-xs text-gray-500">{item.codigo}</div>
                        </td>
                        <td className="p-3 text-center text-gray-800 font-medium">
                          {item.quantidade}
                        </td>
                        <td className="p-3 text-right text-gray-800">
                          {formatCurrency(Number(item.preco_unitario))}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumo */}
          {itens.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total de Itens:</span>
                <span className="font-medium">{totalItens}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Calculado:</span>
                <span className="font-medium">{formatCurrency(totalCalculado)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total da {tipo === "venda" ? "Venda" : "Compra"}:</span>
                <span className="text-[#001A23]">{formatCurrency(Number(dados?.total) || totalCalculado)}</span>
              </div>
            </div>
          )}

          {/* Botão Fechar */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
