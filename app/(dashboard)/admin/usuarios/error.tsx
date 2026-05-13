"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function UsuariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/admin/usuarios error]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Erro na Gestão de Usuários</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ocorreu um erro inesperado. Tente novamente ou contate o suporte.
        </p>
        {error?.message && (
          <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-1 rounded-lg max-w-sm mx-auto">
            {error.message}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
