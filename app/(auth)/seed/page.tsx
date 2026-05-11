"use client";

import { seedTestUsers } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Building2, Users, User, ArrowRight, CheckCircle2 } from "lucide-react";

const PROFILES = [
  {
    role: "ADMIN",
    label: "Administrador",
    email: "admin@teste.com",
    description: "Acesso total ao sistema",
    icon: ShieldCheck,
    color: "text-red-400",
    border: "border-red-500/20 hover:border-red-500/50",
    bg: "bg-red-500/10",
  },
  {
    role: "STORE_MANAGER",
    label: "Gestor de Loja",
    email: "gerente@teste.com",
    description: "Gestão de colaboradores e ponto",
    icon: Building2,
    color: "text-orange-400",
    border: "border-orange-500/20 hover:border-orange-500/50",
    bg: "bg-orange-500/10",
  },
  {
    role: "HR_STAFF",
    label: "Staff RH",
    email: "rh@teste.com",
    description: "Recursos humanos e relatórios",
    icon: Users,
    color: "text-blue-400",
    border: "border-blue-500/20 hover:border-blue-500/50",
    bg: "bg-blue-500/10",
  },
  {
    role: "EMPLOYEE",
    label: "Colaborador",
    email: "colaborador@teste.com",
    description: "Acesso básico ao portal",
    icon: User,
    color: "text-slate-400",
    border: "border-slate-500/20 hover:border-slate-500/50",
    bg: "bg-slate-500/10",
  },
] as const;

const PASSWORD = "admin123";

export default function SeedPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [seeding, setSeeding] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedTestUsers().then((res) => {
      if (res.success) setReady(true);
      else setError(res.error ?? "Erro ao criar usuários");
      setSeeding(false);
    });
  }, []);

  async function handleLogin(email: string) {
    setLoggingIn(email);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password: PASSWORD,
        redirect: false,
      });
      if (result?.error) {
        setError("Erro ao autenticar. Tente recarregar a página.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoggingIn(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg mx-auto">
            <span className="font-black text-xl italic">PC</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Acesso de Teste</h1>
          <p className="text-sm text-slate-400">Clique em um perfil para entrar direto no sistema</p>
        </div>

        {/* Status */}
        {seeding && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-4">
            <Loader2 className="size-4 animate-spin" />
            <span>Preparando usuários de teste...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Profile cards */}
        {ready && (
          <div className="grid grid-cols-1 gap-3">
            {PROFILES.map(({ role, label, email, description, icon: Icon, color, border, bg }) => {
              const isLoading = loggingIn === email;
              return (
                <button
                  key={role}
                  onClick={() => handleLogin(email)}
                  disabled={loggingIn !== null}
                  className={`flex items-center gap-4 rounded-xl border ${border} ${loggingIn && !isLoading ? "opacity-50" : ""} bg-slate-900 p-4 text-left transition-all duration-150 disabled:cursor-not-allowed hover:bg-slate-800`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    {isLoading ? (
                      <Loader2 className={`size-5 ${color} animate-spin`} />
                    ) : (
                      <Icon className={`size-5 ${color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{label}</p>
                    <p className="text-xs text-slate-400 truncate">{email}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
                  </div>
                  <ArrowRight className={`size-4 shrink-0 ${color} opacity-60`} />
                </button>
              );
            })}
          </div>
        )}

        {/* Senha */}
        {ready && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="size-3 text-green-500" />
            <span>Senha de todos os perfis: <span className="font-bold text-slate-300 font-mono">{PASSWORD}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
