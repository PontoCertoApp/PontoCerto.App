"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, LogIn, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else {
        toast.success("Login realizado com sucesso! Bem-vindo de volta.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gradient">PontoCerto</span>
          </Link>
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-center">
            Acesse o painel de controle da sua empresa.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl glass-card">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com seu e-mail e senha cadastrados.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" 
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
              <div className="text-center text-sm">
                Ainda não tem conta?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Cadastre-se grátis
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
