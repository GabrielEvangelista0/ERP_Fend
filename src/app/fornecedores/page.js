import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dados = [
        { id: 1, nome: "Fornecedor A", telefone: "111222333", endereco: "Rua X, 789" },
        { id: 2, nome: "Fornecedor B", telefone: "444555666", endereco: "Rua Y, 101" },
    ]

    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Fornecedores" />
            <div>
                <TabelaDados dados={dados} tipo="fornecedor" />
            </div>
        </div>
    )
}