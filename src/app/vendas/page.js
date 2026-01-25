import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dados = [
        { identificador: "V001", dataVenda: "25/01/2026", clienteAssociado: "Cliente A", usuarioResponsavel: "Admin" },
        { identificador: "V002", dataVenda: "24/01/2026", clienteAssociado: "Cliente B", usuarioResponsavel: "Vendedor" },
    ]

    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Vendas" />
            <div>
                <TabelaDados dados={dados} tipo="venda" />
            </div>
        </div>
    )
}