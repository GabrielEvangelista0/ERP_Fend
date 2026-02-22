"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/AppProvider";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ login: "", senha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const result = await login(form.login, form.senha);
    setLoading(false);
    if (!result.ok) {
      setErro(result.message);
      return;
    }
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Acesso ao ERP</h1>
        <p className="text-sm text-gray-600 mb-6">Entre com usuário e senha.</p>

        <div className="space-y-3">
          <input
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Usuário"
            value={form.login}
            onChange={(e) => setForm((prev) => ({ ...prev, login: e.target.value }))}
            required
          />
          <input
            className="w-full border border-gray-300 rounded p-2"
            placeholder="Senha"
            type="password"
            value={form.senha}
            onChange={(e) => setForm((prev) => ({ ...prev, senha: e.target.value }))}
            required
          />
        </div>

        {erro ? <p className="text-sm text-red-600 mt-3">{erro}</p> : null}

        <button
          type="submit"
          className="mt-5 w-full bg-gray-900 text-white rounded p-2 hover:bg-gray-800 disabled:bg-gray-500"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-4 text-xs text-gray-600">
          <p>`admin` / `admin123`</p>
          <p>`operador` / `operador123`</p>
          <p>`gerente` / `gerente123`</p>
        </div>
      </form>
    </div>
  );
}
