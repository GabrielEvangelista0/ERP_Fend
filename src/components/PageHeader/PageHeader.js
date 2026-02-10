"use client";

export default function PageHeader({ titulo, descricao = "", botaoNome, onCreate }) {
    return (
        <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black mb-1">
                        {titulo}
                    </h1>
                    {descricao && (
                        <p className="text-gray-600 text-sm">
                            {descricao}
                        </p>
                    )}
                </div>
                {botaoNome && (
                    <button
                        onClick={() => onCreate && onCreate()}
                        className="px-4 py-2.5 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 font-medium whitespace-nowrap"
                    >
                        {botaoNome}
                    </button>
                )}
            </div>
        </div>
    )
}
