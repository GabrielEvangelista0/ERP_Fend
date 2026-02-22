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
    if (!hydrated) return;
    const moduleName = moduleFromPath(pathname);

    if (!currentUser && moduleName !== "login") {
      router.replace("/login");
      return;
    }
    if (currentUser && moduleName === "login") {
      router.replace("/");
      return;
    }
    if (currentUser && moduleName !== "login" && !canAccess(moduleName)) {
      router.replace("/");
    }
  }, [hydrated, currentUser, pathname, router, canAccess]);

  if (!hydrated) return null;

  const moduleName = moduleFromPath(pathname);
  if (!currentUser && moduleName !== "login") return null;

  return children;
}
