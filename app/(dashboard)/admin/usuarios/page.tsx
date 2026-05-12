"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  UserPlus, 
  Shield, 
  Building2, 
  Edit, 
  Power, 
  Trash2, 
  Loader2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Store,
  Lock,
  Mail,
  User,
  LayoutGrid
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getUsers, 
  toggleUserAtivo, 
  deleteUser, 
  createUserByAdmin, 
  updateUserDetails 
} from "@/actions/user-actions";
import { getLojas } from "@/actions/loja-actions";
import { getTimesAll } from "@/actions/team-actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    lojaId: "none",
    teamId: "none"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, lojasRes, timesRes] = await Promise.all([
        getUsers(),
        getLojas(),
        getTimesAll()
      ]);
      
      if (usersRes?.success) setUsers(usersRes.data || []);
      setLojas(lojasRes || []);
      setTimes(timesRes || []);
    } catch (err: any) {
      console.error("ERRO NO FETCH DATA:", err);
      toast.error(`Erro ao carregar dados: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await toggleUserAtivo(id);
      if (res?.success) {
        toast.success("Status atualizado!");
        fetchData();
      }
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUserByAdmin({
        ...formData,
        lojaId: formData.lojaId === "none" ? undefined : formData.lojaId,
        teamId: formData.teamId === "none" ? undefined : formData.teamId,
      });

      if (res?.success) {
        toast.success("Usuário criado com sucesso!");
        setIsCreateOpen(false);
        setFormData({ name: "", email: "", password: "", role: "EMPLOYEE", lojaId: "none", teamId: "none" });
        fetchData();
      } else {
        toast.error(res?.error || "Erro ao criar usuário");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await updateUserDetails({
        userId: selectedUser.id,
        name: formData.name,
        role: formData.role,
        lojaId: formData.lojaId === "none" ? null : formData.lojaId,
        teamId: formData.teamId === "none" ? null : formData.teamId,
      });

      if (res?.success) {
        toast.success("Usuário atualizado!");
        setIsEditOpen(false);
        fetchData();
      } else {
        toast.error(res?.error || "Erro ao atualizar");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Not used in edit
      role: user.role || "EMPLOYEE",
      lojaId: user.lojaId || "none",
      teamId: user.teamId || "none"
    });
    setIsEditOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel: Record<string, string> = {
    ADMIN: "ADMINISTRADOR",
    STORE_MANAGER: "GESTOR DE LOJA",
    HR_STAFF: "RH",
    EMPLOYEE: "COLABORADOR",
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Shield className="size-10 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1 font-medium italic">Painel de controle de acessos e hierarquia do sistema.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
              <UserPlus className="size-5" />
              Criar Novo Acesso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-8 overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             <DialogHeader>
               <DialogTitle className="text-2xl font-black flex items-center gap-2">
                 <UserPlus className="size-6 text-primary" />
                 Novo Usuário
               </DialogTitle>
               <DialogDescription className="font-medium text-muted-foreground">Preencha os dados básicos para criar o acesso.</DialogDescription>
             </DialogHeader>
             
             <div className="grid gap-6 py-4 relative z-10">
               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                   <Input 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" 
                     placeholder="Ex: João Silva"
                   />
                 </div>
               </div>
               
               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Login</Label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                   <Input 
                     type="email"
                     value={formData.email} 
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" 
                     placeholder="exemplo@email.com"
                   />
                 </div>
               </div>

               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Inicial</Label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                   <Input 
                     type="password"
                     value={formData.password} 
                     onChange={e => setFormData({...formData, password: e.target.value})}
                     className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" 
                     placeholder="Mínimo 6 caracteres"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Perfil</Label>
                   <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                     <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none focus:ring-0">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                       <SelectItem value="ADMIN" className="rounded-lg h-10 font-bold text-primary">ADMINISTRADOR</SelectItem>
                       <SelectItem value="HR_STAFF" className="rounded-lg h-10 font-medium">RH</SelectItem>
                       <SelectItem value="STORE_MANAGER" className="rounded-lg h-10 font-medium">GESTOR</SelectItem>
                       <SelectItem value="EMPLOYEE" className="rounded-lg h-10 font-medium">COLABORADOR</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="grid gap-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unidade</Label>
                   <Select value={formData.lojaId} onValueChange={val => setFormData({...formData, lojaId: val})}>
                     <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none focus:ring-0">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                       <SelectItem value="none" className="rounded-lg h-10 italic opacity-50">Sem Unidade</SelectItem>
                       {lojas.map(l => (
                         <SelectItem key={l.id} value={l.id} className="rounded-lg h-10 font-medium">{l.nome}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </div>
             
             <DialogFooter className="mt-8">
               <Button 
                onClick={handleCreateUser} 
                disabled={isSubmitting}
                className="w-full rounded-2xl h-14 font-black text-lg gap-2 shadow-2xl shadow-primary/30"
               >
                 {isSubmitting ? <Loader2 className="size-6 animate-spin" /> : <Plus className="size-6" />}
                 Criar Usuário Agora
               </Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* STATS CARDS */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-4"
      >
        {[
          { label: "Total de Usuários", val: users.length, icon: Users, color: "text-foreground" },
          { label: "Contas Ativas", val: users.filter(u => u.ativo).length, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Administradores", val: users.filter(u => u.role === 'ADMIN').length, icon: Shield, color: "text-primary" },
          { label: "Unidades", val: lojas.length, icon: Store, color: "text-amber-500" }
        ].map((stat, i) => (
          <Card key={i} className="surface-card border-none shadow-xl border-t-4 border-t-primary/20 hover:border-t-primary transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="font-black text-[10px] uppercase tracking-widest">{stat.label}</CardDescription>
              <stat.icon className={`size-4 opacity-30 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <CardTitle className={`text-3xl font-black ${stat.color}`}>{stat.val}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* MAIN TABLE SECTION */}
      <Card className="surface-card border-none shadow-2xl overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="border-b bg-muted/10 pb-6 pt-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <CardTitle className="text-2xl font-black tracking-tight">Lista de Acessos</CardTitle>
             <CardDescription className="font-medium">Gerencie e edite permissões de forma centralizada.</CardDescription>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-12 h-12 rounded-2xl bg-background border-none shadow-inner font-medium focus:ring-2 ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <Loader2 className="size-16 animate-spin text-primary" />
                <div className="absolute inset-0 size-16 border-4 border-primary/10 rounded-full" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-black tracking-tight animate-pulse">Sincronizando Dados...</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Consultando Banco SQLite</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pl-10">Usuário do Sistema</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Nível de Acesso</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Lotação / Unidade</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Acesso à Plataforma</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pr-10 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={user.id} 
                      className="group border-b border-border/50 hover:bg-muted/20 transition-all duration-300"
                    >
                      <TableCell className="py-5 pl-10">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="size-12 border-2 border-primary/20 group-hover:border-primary transition-all group-hover:scale-105">
                              <AvatarImage src={user.image} className="object-cover" />
                              <AvatarFallback className="font-black text-sm bg-muted text-muted-foreground uppercase">{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {user.ativo && (
                              <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-base leading-none group-hover:text-primary transition-colors">{user.name}</span>
                            <span className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                              <Mail className="size-3 opacity-50" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-black text-[9px] tracking-widest px-3 py-1 border-none shadow-lg ${
                          user.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 
                          user.role === 'STORE_MANAGER' ? 'bg-amber-500 text-white' : 
                          user.role === 'HR_STAFF' ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {roleLabel[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                            <div className="p-1 bg-primary/10 rounded-md">
                              <Store className="size-3 text-primary" />
                            </div>
                            {user.loja?.nome || "Sede Administrativa"}
                          </div>
                          {user.time && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground pl-1">
                               <LayoutGrid className="size-2.5" />
                               {user.time.nome}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className={`flex items-center gap-2.5 font-black text-[10px] uppercase tracking-tighter px-4 py-2 rounded-full transition-all active:scale-95 border-2 ${
                            user.ativo 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' 
                            : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white'
                          }`}
                        >
                          <Power className="size-3" />
                          {user.ativo ? "Habilitado" : "Bloqueado"}
                        </button>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl size-10 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                              <MoreVertical className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 rounded-3xl p-2 shadow-2xl border-none surface-card bg-background/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-2">Central do Admin</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="rounded-2xl h-12 px-4 gap-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => openEditModal(user)}
                            >
                              <div className="p-2 bg-primary/10 rounded-xl">
                                <Edit className="size-4 text-primary" />
                              </div>
                              Editar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className={`rounded-2xl h-12 px-4 gap-4 font-bold cursor-pointer transition-all ${user.ativo ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <div className={`p-2 rounded-xl ${user.ativo ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                <Power className="size-4" />
                              </div>
                              {user.ativo ? "Suspender Acesso" : "Liberar Acesso"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2 bg-border/50 mx-2" />
                            <DropdownMenuItem 
                              className="rounded-2xl h-12 px-4 gap-4 font-bold cursor-pointer text-destructive hover:bg-destructive/10 transition-all focus:bg-destructive/10 focus:text-destructive"
                              onClick={async () => {
                                if (confirm(`Deseja realmente EXCLUIR o usuário ${user.name}? Esta ação é IRREVERSÍVEL.`)) {
                                  const res = await deleteUser(user.id);
                                  if (res?.success) {
                                    toast.success("Usuário removido com sucesso");
                                    fetchData();
                                  }
                                }
                              }}
                            >
                              <div className="p-2 bg-destructive/10 rounded-xl">
                                <Trash2 className="size-4" />
                              </div>
                              Excluir Conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="size-24 rounded-[2rem] bg-muted flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Search className="size-10 text-muted-foreground opacity-30 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-2xl tracking-tight">Nenhum resultado</h3>
                <p className="text-sm text-muted-foreground font-medium">Não encontramos nenhum usuário com "{search}"</p>
              </div>
              <Button variant="outline" className="rounded-xl px-8" onClick={() => setSearch("")}>Limpar Filtro</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-8">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black flex items-center gap-2">
               <Edit className="size-6 text-primary" />
               Editar Permissões
             </DialogTitle>
             <DialogDescription className="font-medium text-muted-foreground">
               Ajustando acesso para: <span className="text-foreground font-bold">{selectedUser?.name}</span>
             </DialogDescription>
           </DialogHeader>
           
           <div className="grid gap-6 py-6">
             <div className="grid gap-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome de Exibição</Label>
               <Input 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="rounded-xl h-12 bg-muted/30 border-none focus:bg-background" 
               />
             </div>

             <div className="grid gap-4 md:grid-cols-2">
               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Perfil / Cargo</Label>
                 <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                   <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                     <SelectItem value="ADMIN" className="rounded-lg h-10 font-bold text-primary">ADMINISTRADOR</SelectItem>
                     <SelectItem value="HR_STAFF" className="rounded-lg h-10 font-medium">RH</SelectItem>
                     <SelectItem value="STORE_MANAGER" className="rounded-lg h-10 font-medium">GESTOR</SelectItem>
                     <SelectItem value="EMPLOYEE" className="rounded-lg h-10 font-medium">COLABORADOR</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Loja Vinculada</Label>
                 <Select value={formData.lojaId} onValueChange={val => setFormData({...formData, lojaId: val})}>
                   <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                     <SelectItem value="none" className="rounded-lg h-10 italic opacity-50">Sem Unidade</SelectItem>
                     {lojas.map(l => (
                       <SelectItem key={l.id} value={l.id} className="rounded-lg h-10 font-medium">{l.nome}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid gap-2 md:col-span-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time (Opcional)</Label>
                 <Select value={formData.teamId} onValueChange={val => setFormData({...formData, teamId: val})}>
                   <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                     <SelectItem value="none" className="rounded-lg h-10 italic opacity-50">Nenhum Time</SelectItem>
                     {times.filter(t => formData.lojaId === 'none' || t.lojaId === formData.lojaId).map(t => (
                       <SelectItem key={t.id} value={t.id} className="rounded-lg h-10 font-medium">
                         {t.nome} {t.loja?.nome ? `(${t.loja.nome})` : ""}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </div>
           
           <DialogFooter className="mt-4 gap-3 sm:gap-0">
             <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 font-bold">Cancelar</Button>
             <Button 
              onClick={handleUpdateUser} 
              disabled={isSubmitting}
              className="flex-1 rounded-2xl h-12 font-black gap-2 shadow-xl shadow-primary/20"
             >
               {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
               Aplicar Alterações
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper icon missing from lucide-react standard imports in this environment
function Save(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  )
}
