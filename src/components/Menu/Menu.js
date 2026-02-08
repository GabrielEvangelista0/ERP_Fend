'use client';

import { Building2, LayoutDashboard, Users, Truck, Package, TrendingUp, ShoppingCart, DollarSign, FileText, LogOut } from "lucide-react"
import Link from "next/link"

export default function Menu() {
    const links = [
        {
            label: "Dashboard",
            url: "/",
            icon: LayoutDashboard
        },
        {
            label: "Clientes",
            url: "/clientes",
            icon: Users
        },
        {
            label: "Fornecedores",
            url: "/fornecedores",
            icon: Truck
        },
        {
            label: "Produtos",
            url: "/produtos",
            icon: Package
        },
        {
            label: "Vendas",
            url: "/vendas",
            icon: TrendingUp
        },
        {
            label: "Compras",
            url: "/compras",
            icon: ShoppingCart
        },
        {
            label: "Financeiro",
            url: "/financeiro",
            icon: DollarSign
        },
        {
            label: "Relatórios",
            url: "/relatorios",
            icon: FileText
        }
    ]

    const handleLogout = () => {
        // Implementar lógica de logout
        console.log("Logout")
    }

    return (
        <nav className="flex flex-col gap-0 p-6 min-w-56 h-full border-r border-gray-300" style={{ backgroundColor: "#f5f5f5" }}>
            <ul className="flex flex-col gap-0 flex-grow">
                {
                    links.map((link) => {
                        const IconComponent = link.icon
                        return (
                            <li key={link.url}>
                                <Link href={link.url} className="flex items-center gap-3 text-black p-4 hover:bg-gray-200 text-base font-medium transition-colors duration-200">
                                    <IconComponent size={20} />
                                    {link.label}
                                </Link>
                            </li>
                        )
                    })
                }
            </ul>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 text-black p-4 hover:bg-gray-200 text-base font-medium transition-colors duration-200 w-full text-left border-t border-gray-300 mt-4"
            >
                <LogOut size={20} />
                Sair
            </button>
        </nav>
    )
}