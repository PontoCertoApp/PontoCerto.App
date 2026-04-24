"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          © 2025 PontoCerto · Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
}
