import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black">404</h1>
        <h2 className="text-xl font-semibold">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-sm">
          A página que você está buscando não existe ou foi removida.
        </p>
      </div>
      <Link href="/dashboard" className="inline-flex">
        <Button>
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}
