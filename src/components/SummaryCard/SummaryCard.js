export default function SummaryCard({ titulo, valor, descricao, destaque }) {
    return (
        <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${destaque ? 'ring-2 ring-teal-100' : ''}`}>
            <div className="flex items-baseline justify-between">
                <p className="text-gray-600 text-sm font-medium">{titulo}</p>
            </div>
            <p className={`text-2xl font-bold my-2 ${destaque ? 'text-teal-600' : 'text-black'}`}>{valor}</p>
            {descricao && <p className="text-gray-500 text-xs">{descricao}</p>}
        </div>
    )
}
