"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, ShieldCheck, Building2, Users, User, ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedTestUsers } from "@/actions/auth-actions";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const TEST_PROFILES = [
  { label: "Admin",         email: "admin@teste.com",       role: "ADMIN",         icon: ShieldCheck, color: "text-red-400" },
  { label: "Gestor",        email: "gerente@teste.com",     role: "STORE_MANAGER", icon: Building2,   color: "text-orange-400" },
  { label: "RH",            email: "rh@teste.com",          role: "HR_STAFF",      icon: Users,       color: "text-blue-400" },
  { label: "Colaborador",   email: "colaborador@teste.com", role: "EMPLOYEE",      icon: User,        color: "text-slate-400" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [showTestAccess, setShowTestAccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestLogin(email: string) {
    setTestLoading(email);
    setErrorMessage(null);
    try {
      // Garante que os usuários de teste existem
      await seedTestUsers();

      const result = await signIn("credentials", {
        email,
        password: "admin123",
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("Erro ao entrar com perfil de teste. Tente novamente.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setErrorMessage("Ocorreu um erro inesperado.");
    } finally {
      setTestLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4">
            <span className="font-black text-2xl italic">PC</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">PontoCerto</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de RH Integrado</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com sua conta para continuar</p>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={`pl-9 h-11 ${errors.email ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`pl-9 h-11 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline underline-offset-4">
              Cadastre-se grátis
            </Link>
          </div>
        </div>

        {/* Acesso de Teste */}
        <div className="mt-4">
          <button
            onClick={() => setShowTestAccess(!showTestAccess)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2"
          >
            <span>Acesso de teste</span>
            <ChevronDown className={`size-3 transition-transform ${showTestAccess ? "rotate-180" : ""}`} />
          </button>

          {showTestAccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-3 grid grid-cols-2 gap-2"
            >
              {TEST_PROFILES.map(({ label, email, icon: Icon, color }) => (
                <button
                  key={email}
                  onClick={() => handleTestLogin(email)}
                  disabled={testLoading !== null}
                  className="flex items-center gap-2 rounded-xl border border-border/30 hover:border-border hover:bg-muted/50 px-3 py-2.5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testLoading === email ? (
                    <Loader2 className={`size-4 shrink-0 ${color} animate-spin`} />
                  ) : (
                    <Icon className={`size-4 shrink-0 ${color}`} />
                  )}
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          © 2025 PontoCerto · Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
}
