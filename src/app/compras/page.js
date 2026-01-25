import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dados = [
        { identificador: "CMP001", valor: "R$ 500,00", dataVencimento: "05/02/2026", fornecedor: "Fornecedor A" },
        { identificador: "CMP002", valor: "R$ 750,00", dataVencimento: "12/02/2026", fornecedor: "Fornecedor B" },
    ]

    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Compras" />
            <div>
                <TabelaDados dados={dados} tipo="contaPagar" />
            </div>
        </div>
    )
}