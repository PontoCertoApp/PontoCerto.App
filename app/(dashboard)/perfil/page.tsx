"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Shield, 
  Building, 
  Key, 
  Save,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PerfilPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-background border shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="text-4xl font-black bg-primary text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-background">
            <User className="size-5" />
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start gap-2 relative z-10">
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black tracking-tight">{user?.name}</h1>
             <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1">
               {user?.role}
             </Badge>
          </div>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <Mail className="size-4" />
            {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Conta Verificada</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8 md:grid-cols-2"
      >
        <motion.div variants={item}>
          <Card className="surface-card border-none premium-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Shield className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">Informações Básicas</CardTitle>
              </div>
              <CardDescription>Visualize seus dados de cadastro no PontoCerto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome de Exibição</Label>
                <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex items-center gap-3 font-medium">
                  <User className="size-4 opacity-40" />
                  {user?.name}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail Principal</Label>
                <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex items-center gap-3 font-medium">
                  <Mail className="size-4 opacity-40" />
                  {user?.email}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loja Vinculada</Label>
                <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex items-center gap-3 font-medium">
                  <Building className="size-4 opacity-40" />
                  Loja Matriz (Logística)
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="surface-card border-none premium-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Key className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">Segurança</CardTitle>
              </div>
              <CardDescription>Atualize sua senha de acesso ao sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current">Senha Atual</Label>
                <Input id="current" type="password" placeholder="••••••••" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Nova Senha</Label>
                <Input id="new" type="password" placeholder="Mínimo 8 caracteres" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                <Input id="confirm" type="password" placeholder="Repita a nova senha" className="rounded-xl" />
              </div>
              <Button className="w-full rounded-2xl font-bold h-12 gap-2 shadow-lg shadow-primary/20">
                <Save className="size-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
