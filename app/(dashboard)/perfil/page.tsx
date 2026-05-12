"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  CheckCircle2,
  Camera,
  Loader2,
  User,
  Mail,
  Shield,
  Building,
  Key,
  Save,
  UserCog
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateProfile, promoteToAdmin } from "@/actions/user-actions";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingBasic, setIsUpdatingBasic] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const user = session?.user;
  const promotionAttempted = useRef(false);

  useEffect(() => {
    if (user?.email === 'henriquemendonca060502@gmail.com' && user?.role !== 'ADMIN' && !promotionAttempted.current) {
      promotionAttempted.current = true;
      promoteToAdmin(user.email).then((res) => {
        if (res.success) {
          update();
          toast.success("Perfil de Administrador ativado!");
        }
      });
    }
  }, [user, update]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

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

  const handlePhotoUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadResult = await res.json();

        if (uploadResult.success) {
          const result = await updateProfile({ image: uploadResult.path });
          if (result.success) {
            await update({
              ...session,
              user: {
                ...session?.user,
                image: uploadResult.path
              }
            });
            toast.success("Foto de perfil atualizada!");
          } else {
            toast.error(result.error || "Erro ao salvar no banco");
          }
        } else {
          toast.error(uploadResult.error || "Erro no upload");
        }
      } catch (err) {
        toast.error("Erro inesperado ao atualizar foto");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  const handleUpdateBasic = async () => {
    setIsUpdatingBasic(true);
    try {
      const result = await updateProfile({ name, email });
      if (result.success) {
        await update();
        toast.success("Informações atualizadas!");
      } else {
        toast.error(result.error || "Erro ao atualizar");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    } finally {
      setIsUpdatingBasic(false);
    }
  };

  const handleUpdateSecurity = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      const result = await updateProfile({ 
        currentPassword, 
        newPassword 
      });
      if (result.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Erro ao alterar senha");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-background border shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-105">
            <AvatarImage src={user?.image ?? undefined} className="object-cover" />
            <AvatarFallback className="text-4xl font-black bg-primary text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <button 
            onClick={handlePhotoUpload}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-3 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background hover:bg-primary/90 transition-all active:scale-90 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Camera className="size-5" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center md:items-start gap-2 relative z-10">
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black tracking-tight">{user?.name}</h1>
             <Badge className="bg-primary text-primary-foreground border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg shadow-primary/20">
               {user?.role === 'ADMIN' ? 'Administrador' : 
                user?.role === 'HR_STAFF' ? 'RH' : 
                user?.role === 'STORE_MANAGER' ? 'Gestor' : 'Colaborador'}
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

      {user?.role === 'ADMIN' && (
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="surface-card border-none premium-shadow bg-gradient-to-r from-primary/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <Shield className="size-6 text-primary" />
                  Painel de Administração
                </CardTitle>
                <CardDescription>Gerencie todos os usuários e permissões da plataforma.</CardDescription>
              </div>
              <Button asChild className="rounded-2xl font-bold h-12 px-8 shadow-xl shadow-primary/30">
                <Link href="/config/usuarios">
                  Gerenciar Contas
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </motion.div>
      )}

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
                  <User className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">Informações Básicas</CardTitle>
              </div>
              <CardDescription>Visualize e altere seus dados de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome de Exibição</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-40" />
                  <Input 
                    id="displayName" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-muted focus:bg-background" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainEmail" className="text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail Principal</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-40" />
                  <Input 
                    id="mainEmail" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-muted focus:bg-background" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Unidade Vinculada</Label>
                <div className="p-4 rounded-2xl bg-muted/30 border border-muted flex items-center gap-3 font-medium">
                  <Building className="size-4 opacity-40" />
                  {user?.loja?.nome || "Sede (Administrativo)"}
                </div>
              </div>
              <Button 
                onClick={handleUpdateBasic} 
                disabled={isUpdatingBasic || (name === user?.name && email === user?.email)}
                className="w-full rounded-2xl font-bold h-12 gap-2 shadow-lg shadow-primary/20"
              >
                {isUpdatingBasic ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar Informações
              </Button>
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
                <Input 
                  id="current" 
                  type="password" 
                  placeholder="••••••••" 
                  className="rounded-xl" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Nova Senha</Label>
                <Input 
                  id="new" 
                  type="password" 
                  placeholder="Mínimo 8 caracteres" 
                  className="rounded-xl" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  placeholder="Repita a nova senha" 
                  className="rounded-xl" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpdateSecurity}
                disabled={isUpdatingSecurity || !currentPassword || !newPassword || !confirmPassword}
                className="w-full rounded-2xl font-bold h-12 gap-2 shadow-lg shadow-primary/20"
              >
                {isUpdatingSecurity ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar Nova Senha
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
