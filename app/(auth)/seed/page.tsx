"use client";

import { seedTestUsers } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, UserCircle } from "lucide-react";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await seedTestUsers();
      if (res.success) {
        toast.success(res.message);
        setDone(true);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao processar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md border-primary/20 bg-slate-900 text-slate-100 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Inicializar Usuários de Teste</CardTitle>
          <CardDescription className="text-slate-400">
            Cria acessos para os 4 níveis de permissão do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-300">Acessos que serão criados:</p>
            <ul className="text-xs space-y-2 text-slate-400">
              <li className="flex items-center gap-2"><UserCircle className="size-3 text-red-500" /> admin@teste.com (ADMIN)</li>
              <li className="flex items-center gap-2"><UserCircle className="size-3 text-orange-500" /> gerente@teste.com (STORE_MANAGER)</li>
              <li className="flex items-center gap-2"><UserCircle className="size-3 text-blue-500" /> rh@teste.com (HR_STAFF)</li>
              <li className="flex items-center gap-2"><UserCircle className="size-3 text-slate-500" /> colaborador@teste.com (EMPLOYEE)</li>
            </ul>
            <p className="text-[10px] text-primary/70 mt-2 font-bold uppercase">Senha padrão: admin123</p>
          </div>

          {!done ? (
            <Button 
              onClick={handleSeed} 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando usuários...
                </>
              ) : (
                "Criar Usuários de Teste"
              )}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="size-12 text-green-500 animate-in zoom-in duration-300" />
              <p className="text-sm font-bold text-green-400">Pronto! Você já pode logar.</p>
              <Button asChild variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-200">
                <a href="/login">Ir para Login</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
