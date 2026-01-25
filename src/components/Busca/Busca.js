export default function Busca({ nomePagina, handleInputChange, botaoNome }) {
    return (
        <header className="p-6 bg-white shadow-md text-gray-800 flex-1">
            <h1>
                {nomePagina}
            </h1>
            <div className="flex items-center gap-5">
                <input
                    type="text"
                    placeholder={`Buscar em ${nomePagina}...`}
                    className="mt-4 p-2 border border-gray-300 rounded w-full"
                />
                <button className="mt-4 whitespace-nowrap px-3 py-2.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    + novo {botaoNome}
                </button>
            </div>


        </header>
    )
}