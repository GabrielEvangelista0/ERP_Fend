import React from 'react';
import './TabelaDados.css';

const TabelaDados = ({ dados, tipo }) => {
    const renderCabecalho = () => {
        switch (tipo) {
            case 'usuario':
                return ["Nome", "Login", "Senha", "Tipo"];
            case 'cliente':
                return ["ID", "Nome", "Telefone", "Endereço"];
            case 'fornecedor':
                return ["ID", "Nome", "Telefone", "Endereço"];
            case 'produto':
                return ["ID", "Descrição", "Preço", "Quantidade em Estoque", "Nome do Produto"];
            case 'venda':
                return ["Identificador da Venda", "Data da Venda", "Cliente Associado", "Usuário Responsável"];
            case 'contaReceber':
                return ["Identificador", "Valor", "Data de Vencimento", "Cliente"];
            case 'contaPagar':
                return ["Identificador", "Valor", "Data de Vencimento", "Fornecedor"];
            default:
                return [];
        }
    };

    const renderLinhas = () => {
        return dados.map((item, index) => (
            <tr key={index}>
                {Object.values(item).map((valor, i) => (
                    <td key={i}>{valor}</td>
                ))}
            </tr>
        ));
    };

    return (
        <table className="tabela">
            <thead>
                <tr>
                    {renderCabecalho().map((cabecalho, index) => (
                        <th key={index}>{cabecalho}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {renderLinhas()}
            </tbody>
        </table>
    );
};

export default TabelaDados;