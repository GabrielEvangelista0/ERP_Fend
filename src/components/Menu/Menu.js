'use client';

import { Activity, DollarSign, FileText, LayoutDashboard, LogOut, Package, ShoppingCart, TrendingUp, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/AppProvider";

export default function Menu() {
  const { canAccess, logout } = useApp();
  const router = useRouter();

  const links = [
    { label: "Dashboard", url: "/", icon: LayoutDashboard },
    { label: "Clientes", url: "/clientes", icon: Users },
    { label: "Fornecedores", url: "/fornecedores", icon: Truck },
    { label: "Produtos", url: "/produtos", icon: Package },
    { label: "Vendas", url: "/vendas", icon: TrendingUp },
    { label: "Compras", url: "/compras", icon: ShoppingCart },
    { label: "Financeiro", url: "/financeiro", icon: DollarSign },
    { label: "Relatorios", url: "/relatorios", icon: FileText },
    { label: "Usuarios", url: "/usuarios", icon: Users },
    { label: "Logs", url: "/logs", icon: Activity },
  ].filter((item) => {
    const moduleName = item.url === "/" ? "dashboard" : item.url.replace("/", "");
    return canAccess(moduleName);
  });

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <nav className="flex flex-col gap-0 p-6 min-w-56 h-full border-r border-gray-300 bg-gray-100">
      <ul className="flex flex-col gap-0 flex-grow">
        {links.map((link) => {
          const IconComponent = link.icon;
          return (
            <li key={link.url}>
              <Link href={link.url} className="flex items-center gap-3 text-black p-4 hover:bg-gray-200 text-base font-medium transition-colors duration-200">
                <IconComponent size={20} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-black p-4 hover:bg-gray-200 text-base font-medium transition-colors duration-200 w-full text-left border-t border-gray-300 mt-4"
      >
        <LogOut size={20} />
        Sair
      </button>
    </nav>
  );
}
