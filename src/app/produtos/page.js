import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dados = [
        { id: 1, descricao: "Produto A", preco: "R$ 100,00", quantidade: 50, nomeProduto: "Produto A" },
        { id: 2, descricao: "Produto B", preco: "R$ 200,00", quantidade: 30, nomeProduto: "Produto B" },
    ]

    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Produtos" />
            <div>
                <TabelaDados dados={dados} tipo="produto" />
            </div>
        </div>
    )
}