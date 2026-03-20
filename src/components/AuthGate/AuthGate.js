"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/providers/AppProvider";

function moduleFromPath(pathname) {
  if (!pathname || pathname === "/") return "dashboard";
  const head = pathname.split("/")[1];
  if (head === "logs") return "logs";
  if (head === "usuarios") return "usuarios";
  if (head === "login") return "login";
  return head;
}

export default function AuthGate({ children }) {
  const { hydrated, currentUser, canAccess } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.debug('[AuthGate] useEffect triggered', { 
      hydrated, 
      currentUser: currentUser?.login, 
      pathname,
      timestamp: new Date().toISOString()
    });
    
    if (!hydrated) {
      console.debug('[AuthGate] não hidratado ainda, abortando');
      return;
    }
    
    const moduleName = moduleFromPath(pathname);
    console.debug('[AuthGate] módulo detectado:', moduleName);

    if (!currentUser && moduleName !== "login") {
      console.debug('[AuthGate] sem usuário e não é login, redirecionando para /login');
      router.replace("/login");
      return;
    }
    
    if (currentUser && moduleName === "login") {
      console.debug('[AuthGate] usuário logado tentando acessar login, redirecionando para /');
      router.replace("/");
      return;
    }
    
    if (currentUser && moduleName !== "login" && !canAccess(moduleName)) {
      console.debug('[AuthGate] usuário sem acesso ao módulo, redirecionando para /');
      router.replace("/");
    }
  }, [hydrated, currentUser, pathname, router, canAccess]);

  if (!hydrated) return null;

  const moduleName = moduleFromPath(pathname);
  if (!currentUser && moduleName !== "login") return null;

  return children;
}
