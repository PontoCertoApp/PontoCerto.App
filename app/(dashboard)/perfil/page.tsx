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
  UserCog,
  Settings,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            await update();
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

  const roleLabel: Record<string, string> = {
    ADMIN: "ADMINISTRADOR",
    STORE_MANAGER: "GESTOR DE LOJA",
    HR_STAFF: "RH",
    EMPLOYEE: "COLABORADOR",
  };

  // UI-LEVEL FORCE: Se for o email mestre, sempre exibir como ADMINISTRADOR
  const isMaster = user?.email?.toLowerCase() === 'henriquemendonca060502@gmail.com';
  const effectiveRole = isMaster ? 'ADMIN' : (user?.role || 'EMPLOYEE');
  const userRoleLabel = roleLabel[effectiveRole] || "COLABORADOR";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* HEADER PREMIUM */}
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
               {userRoleLabel}
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

      {/* TABS INTERFACE */}
      <Tabs defaultValue="perfil" className="w-full space-y-8">
        <div className="flex justify-center md:justify-start overflow-x-auto pb-2">
          <TabsList className="bg-muted/50 p-1 rounded-2xl border">
            <TabsTrigger value="perfil" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg gap-2">
              <User className="size-4" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg gap-2">
              <Key className="size-4" />
              Segurança
            </TabsTrigger>
            {effectiveRole === 'ADMIN' && (
              <TabsTrigger value="admin" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl gap-2 text-primary">
                <Shield className="size-4" />
                Painel Administrativo
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* PERFIL TAB */}
        <TabsContent value="perfil">
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-8 md:grid-cols-2">
            <Card className="surface-card border-none premium-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Settings className="size-5" />
                  </div>
                  <CardTitle className="text-xl font-bold">Informações de Acesso</CardTitle>
                </div>
                <CardDescription>Gerencie seu nome público e e-mail de login.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome de Exibição</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl bg-muted/30 border-muted" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail de Login</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-muted/30 border-muted" 
                  />
                </div>
                <Button 
                  onClick={handleUpdateBasic} 
                  disabled={isUpdatingBasic || (name === user?.name && email === user?.email)}
                  className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
                >
                  {isUpdatingBasic ? <Loader2 className="size-4 animate-spin" /> : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>

            <Card className="surface-card border-none premium-shadow bg-gradient-to-br from-muted/5 to-transparent border-dashed border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-muted text-muted-foreground rounded-xl">
                    <Building className="size-5" />
                  </div>
                  <CardTitle className="text-xl font-bold">Vínculo Institucional</CardTitle>
                </div>
                <CardDescription>Sua unidade de atuação no PontoCerto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-2xl bg-muted/30 border border-muted flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unidade Atual</span>
                  <span className="text-xl font-bold text-foreground">{user?.loja?.nome || "Sede (Administrativo)"}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Para alterar seu vínculo, entre em contato com o RH.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* SEGURANÇA TAB */}
        <TabsContent value="seguranca">
          <Card className="max-w-2xl mx-auto surface-card border-none premium-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Key className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">Alterar Senha</CardTitle>
              </div>
              <CardDescription>Mantenha sua conta segura trocando sua senha periodicamente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl h-12" />
                </div>
              </div>
              <Button 
                onClick={handleUpdateSecurity}
                disabled={isUpdatingSecurity || !currentPassword || !newPassword}
                className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
              >
                {isUpdatingSecurity ? <Loader2 className="size-4 animate-spin" /> : "Atualizar Senha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMIN TAB */}
        <TabsContent value="admin">
          {effectiveRole === 'ADMIN' && (
            <div className="space-y-8">
              <Card className="surface-card border-none premium-shadow bg-gradient-to-r from-primary/20 to-primary/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-black text-primary">Painel de Controle do Administrador</CardTitle>
                    <CardDescription className="text-primary/70 font-medium">Controle total sobre acessos, permissões e contas da plataforma.</CardDescription>
                  </div>
                  <Shield className="size-16 text-primary/20" />
                </CardHeader>
              </Card>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="surface-card border-none premium-shadow hover:scale-[1.02] transition-transform cursor-pointer" asChild>
                  <Link href="/config/usuarios">
                    <CardHeader className="p-6">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <Users className="size-6" />
                      </div>
                      <CardTitle>Gerenciar Contas</CardTitle>
                      <CardDescription>Lista de usuários, alteração de cargos e exclusão de contas.</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
                
                <Card className="surface-card border-none premium-shadow hover:scale-[1.02] transition-transform cursor-pointer" asChild>
                  <Link href="/config/lojas">
                    <CardHeader className="p-6">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <Building className="size-6" />
                      </div>
                      <CardTitle>Gerenciar Unidades</CardTitle>
                      <CardDescription>Adicionar ou editar lojas e sedes do PontoCerto.</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>

                <Card className="surface-card border-none premium-shadow hover:scale-[1.02] transition-transform cursor-pointer" asChild>
                  <Link href="/config/funcoes">
                    <CardHeader className="p-6">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <UserCog className="size-6" />
                      </div>
                      <CardTitle>Cargos & Permissões</CardTitle>
                      <CardDescription>Configurar os níveis de acesso e descrições de cargo.</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
