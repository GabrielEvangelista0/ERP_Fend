"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header/Header";
import Menu from "@/components/Menu/Menu";
import { AppProvider } from "@/providers/AppProvider";
import AuthGate from "@/components/AuthGate/AuthGate";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <AppProvider>
      <AuthGate>
        {isLogin ? (
          <main className="min-h-screen bg-gray-100">{children}</main>
        ) : (
          <>
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Menu />
              <main className="flex-1 overflow-auto bg-gray-200">{children}</main>
            </div>
          </>
        )}
      </AuthGate>
    </AppProvider>
  );
}
