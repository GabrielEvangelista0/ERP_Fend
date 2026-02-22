import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ERP - Sistema Integrado",
  description: "Sistema ERP com estoque, vendas, compras, financeiro e usuários",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body
        className={`flex flex-col ${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
