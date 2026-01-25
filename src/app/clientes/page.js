import Busca from "@/components/Busca/Busca";
import TabelaDados from "@/components/TabelaDados/TabelaDados";

export default function Page() {
    const dados = [
        { id: 1, nome: "Cliente A", telefone: "123456789", endereco: "Rua A, 123" },
        { id: 2, nome: "Cliente B", telefone: "987654321", endereco: "Rua B, 456" },
    ]
    return (
        <div className="flex-1 min-h-screen p-6">
            <Busca nomePagina="Clientes" botaoNome="Cliente" />
            <div>
                <TabelaDados dados={dados} tipo="cliente" />
            </div>
        </div>
    )
}