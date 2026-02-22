"use client";

import { Building2, User } from "lucide-react"
import { useApp } from "@/providers/AppProvider";

export default function Header() {
    const { currentUser } = useApp();

    return (
        <header className="flex items-center justify-between p-2 h-20 bg-white border-b border-gray-300" style={{ backgroundColor: "#f9f9f9" }}>
            <h1 className="flex items-center gap-2 text-black text-2xl font-bold">
                <Building2 size={32} /> ERP
            </h1>
            <div className="flex items-center gap-3 pr-2">
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{currentUser?.nome || "Sem sessão"}</p>
                    <p className="text-xs text-gray-600 capitalize">{currentUser?.tipo || "-"}</p>
                </div>
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-400 hover:bg-gray-500 transition-colors">
                    <User size={24} className="text-white" />
                </button>
            </div>
        </header>
    )
}
