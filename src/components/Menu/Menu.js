import Link from "next/link"

export default function Menu() {
    const links = [
        {
            label: "Dashboard",
            url: "/dashboard"
        },
        {
            label: "Clientes",
            url: "/clientes"
        },
        {
            label: "Fornecedores",
            url: "/fornecedores"
        },
        {
            label: "Produtos",
            url: "/produtos"
        },
        {
            label: "Vendas",
            url: "/vendas"
        },
        {
            label: "Compras",
            url: "/compras"
        },
        {
            label: "Financeiro",
            url: "/financeiro"
        }
    ]
    return (
        <nav className="flex flex-col gap-2 p-6 w-64" style={{ backgroundColor: "#0950c3" }}>
            <ul className="flex flex-col gap-3">
                {
                    links.map((link) => (
                        <li key={link.url}>
                            <Link href={link.url} className="text-white hover:text-gray-200 text-lg font-medium transition-colors">
                                {link.label}
                            </Link>
                        </li>
                    ))
                }
            </ul>
        </nav>
    )
}