import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dadosReceber = [
        { identificador: "CR001", valor: "R$ 1.500,00", dataVencimento: "28/02/2026", cliente: "Cliente A" },
        { identificador: "CR002", valor: "R$ 2.000,00", dataVencimento: "15/03/2026", cliente: "Cliente B" },
    ]

    const dadosPagar = [
        { identificador: "CP001", valor: "R$ 800,00", dataVencimento: "10/02/2026", fornecedor: "Fornecedor A" },
        { identificador: "CP002", valor: "R$ 1.200,00", dataVencimento: "20/02/2026", fornecedor: "Fornecedor B" },
    ]

    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Financeiro" />
            <div>
                <h2 style={{ marginTop: "30px", marginBottom: "15px" }}>Contas a Receber</h2>
                <TabelaDados dados={dadosReceber} tipo="contaReceber" />
                <h2 style={{ marginTop: "30px", marginBottom: "15px" }}>Contas a Pagar</h2>
                <TabelaDados dados={dadosPagar} tipo="contaPagar" />
            </div>
        </div>
    )
}