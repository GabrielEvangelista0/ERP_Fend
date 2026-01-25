import Busca from "@/components/Busca/Busca";
import Menu from "@/components/Menu/Menu";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex-1 min-h-screen bg-zinc-50 font-sans ">
      <Busca nomePagina="Dashboard" />
    </div>
  );
}
