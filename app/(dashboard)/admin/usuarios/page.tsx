"use client";

import { useEffect, useState, useMemo } from "react";
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
  Store,
  Lock,
  Mail,
  User,
  LayoutGrid,
  Filter,
  Download,
  KeyRound,
  History,
  X
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
  DialogClose,
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
  updateUserDetails,
  adminResetPassword 
} from "@/actions/user-actions";
import { getLojas } from "@/actions/loja-actions";
import { getTimesAll } from "@/actions/team-actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    unidade: "",
    team: ""
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || 
                          u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? u.ativo : !u.ativo);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const exportToExcel = () => {
    const data = filteredUsers.map(u => ({
      Nome: u.name,
      Email: u.email,
      Nivel: u.role,
      Unidade: u.loja?.nome || "Geral",
      Time: u.time?.nome || "---",
      Status: u.ativo ? "Ativo" : "Bloqueado",
      CriadoEm: new Date(u.createdAt).toLocaleDateString('pt-BR')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "gestao-usuarios-pontocerto.xlsx");
    toast.success("Relatório exportado!");
  };

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

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await adminResetPassword({ userId: selectedUser.id, newPassword: newPass });
      if (res?.success) {
        toast.success(`Senha de ${selectedUser.name} alterada!`);
        setIsResetOpen(false);
        setNewPass("");
      }
    } catch {
      toast.error("Erro ao resetar senha");
    } finally {
      setIsSubmitting(false);
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
      });

      if (res?.success) {
        toast.success("Usuário criado com sucesso!");
        setIsCreateOpen(false);
        setFormData({ name: "", email: "", password: "", role: "COLABORADOR", unidade: "", team: "" });
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
        unidade: formData.unidade,
        team: formData.team,
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
      password: "",
      role: user.role || "",
      unidade: user.loja?.nome || "",
      team: user.time?.nome || ""
    });
    setIsEditOpen(true);
  };

  const roleLabel: Record<string, string> = {
    ADMIN: "ADMINISTRADOR",
    STORE_MANAGER: "GESTOR DE UNIDADE",
    HR_STAFF: "RECURSOS HUMANOS (RH)",
    COLABORADOR: "COLABORADOR PADRÃO",
  };

  const roleColor: Record<string, string> = {
    ADMIN: "bg-primary text-primary-foreground",
    STORE_MANAGER: "bg-amber-500 text-white",
    HR_STAFF: "bg-indigo-500 text-white",
    COLABORADOR: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
               <Shield className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest">Master Control</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3 uppercase">
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground font-medium italic opacity-70">Hierarquia e privilégios de acesso do ecossistema PontoCerto.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={exportToExcel}
            variant="outline" 
            className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/20 hover:bg-primary/10 transition-all"
          >
            <Download className="size-4" />
            Relatório XLSX
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl h-12 px-8 font-black gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95 bg-primary text-primary-foreground"
          >
            <UserPlus className="size-5" />
            Novo Acesso
          </Button>
        </div>
      </motion.div>

      {/* STATS SECTION */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-4"
      >
        {[
          { label: "Total de Usuários", val: users.length, icon: Users, color: "text-foreground", bg: "bg-muted/30" },
          { label: "Contas Ativas", val: users.filter(u => u.ativo).length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Administradores", val: users.filter(u => u.role === 'ADMIN').length, icon: Shield, color: "text-primary", bg: "bg-primary/10" },
          { label: "Unidades", val: lojas.length, icon: Store, color: "text-amber-500", bg: "bg-amber-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-none shadow-2xl relative overflow-hidden group hover:y-[-5px] transition-all">
            <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500", stat.color)}>
               <stat.icon className="size-16" />
            </div>
            <CardHeader className="pb-1">
              <CardDescription className="font-black text-[10px] uppercase tracking-widest opacity-60">{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                 <CardTitle className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.val}</CardTitle>
                 <Badge variant="outline" className="text-[9px] font-bold uppercase opacity-40">Global</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* FILTERS SECTION */}
      <Card className="glass-card border-none shadow-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pesquisar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
              <Input 
                placeholder="Busque por nome, e-mail ou cargo..." 
                className="pl-12 h-12 rounded-2xl bg-muted/20 border-none shadow-inner font-medium focus:ring-2 ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 min-w-[200px]">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nível de Acesso</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none font-bold uppercase text-[10px] tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="ALL">Todos os Níveis</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="HR_STAFF">RH (Recursos Humanos)</SelectItem>
                  <SelectItem value="STORE_MANAGER">Gestor de Unidade</SelectItem>
                  <SelectItem value="COLABORADOR">Colaborador Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-[160px]">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none font-bold uppercase text-[10px] tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Somente Ativos</SelectItem>
                  <SelectItem value="BLOCKED">Somente Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}
              variant="ghost" 
              className="mt-6 h-12 w-12 rounded-2xl border-none hover:bg-destructive/10 hover:text-destructive group"
            >
              <X className="size-5 group-hover:rotate-90 transition-transform" />
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLE SECTION */}
      <Card className="surface-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-sm font-black uppercase tracking-widest animate-pulse opacity-40">Consultando Base de Dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pl-10 text-muted-foreground/60">Colaborador / Acesso</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 text-muted-foreground/60">Privilégios</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 text-muted-foreground/60">Unidade de Lotação</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 text-muted-foreground/60">Estado de Acesso</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pr-10 text-right text-muted-foreground/60">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={user.id} 
                        className="group border-b border-border/20 hover:bg-primary/[0.02] transition-colors"
                      >
                        <TableCell className="py-6 pl-10">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="size-14 border-2 border-primary/10 group-hover:border-primary transition-all group-hover:scale-105 shadow-xl">
                                <AvatarImage src={user.image} className="object-cover" />
                                <AvatarFallback className="font-black text-lg bg-muted text-muted-foreground">{user.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-card shadow-sm flex items-center justify-center",
                                user.ativo ? "bg-emerald-500" : "bg-destructive"
                              )}>
                                 {user.ativo ? <CheckCircle2 className="size-2 text-white" /> : <Power className="size-2 text-white" />}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-lg leading-tight tracking-tighter group-hover:text-primary transition-colors">{user.name}</span>
                              <span className="text-xs text-muted-foreground font-bold flex items-center gap-2 mt-1 uppercase opacity-60">
                                <Mail className="size-3" />
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-black text-[9px] tracking-widest px-4 py-1.5 border-none shadow-md uppercase", roleColor[user.role])}>
                            {roleLabel[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-foreground/80">
                              <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <Store className="size-4 text-primary" />
                              </div>
                              {user.loja?.nome || "Sede Administrativa"}
                            </div>
                            {user.time && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground pl-1 opacity-60">
                                 <LayoutGrid className="size-3" />
                                 {user.time.nome}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={() => handleToggleStatus(user.id)}
                            className={cn(
                              "flex items-center gap-3 font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-2xl transition-all active:scale-95 border",
                              user.ativo 
                              ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20' 
                              : 'bg-destructive/5 text-destructive border-destructive/10 hover:bg-destructive hover:text-white hover:shadow-lg hover:shadow-destructive/20'
                            )}
                          >
                            <Power className="size-4" />
                            {user.ativo ? "Habilitado" : "Bloqueado"}
                          </button>
                        </TableCell>
                        <TableCell className="pr-10 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-2xl size-12 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                              >
                                <MoreVertical className="size-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-72 rounded-[2rem] p-3 shadow-2xl border-none bg-card/95 backdrop-blur-2xl z-[100]"
                            >
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2 flex items-center gap-2">
                                  <Shield className="size-3" />
                                  Ações Administrativas
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="my-2 bg-border/20 mx-2" />
                                
                                <DropdownMenuItem 
                                  className="rounded-2xl h-14 px-4 gap-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-all mb-1"
                                  onClick={() => { setSelectedUser(user); setIsViewOpen(true); }}
                                >
                                  <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Users className="size-5 text-primary" />
                                  </div>
                                  <div>
                                     <p className="text-sm">Visualizar Dados</p>
                                     <p className="text-[9px] font-bold uppercase opacity-50">Ver ficha completa do usuário</p>
                                  </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className="rounded-2xl h-14 px-4 gap-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-all mb-1"
                                  onClick={() => openEditModal(user)}
                                >
                                  <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Edit className="size-5 text-primary" />
                                  </div>
                                  <div>
                                     <p className="text-sm">Editar Acesso</p>
                                     <p className="text-[9px] font-bold uppercase opacity-50">Alterar permissões e lotação</p>
                                  </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className="rounded-2xl h-14 px-4 gap-4 font-bold cursor-pointer hover:bg-amber-500/10 hover:text-amber-500 transition-all mb-1"
                                  onClick={() => { setSelectedUser(user); setIsResetOpen(true); }}
                                >
                                  <div className="p-3 bg-amber-500/10 rounded-2xl">
                                    <KeyRound className="size-5 text-amber-500" />
                                  </div>
                                  <div>
                                     <p className="text-sm">Resetar Senha</p>
                                     <p className="text-[9px] font-bold uppercase opacity-50">Gerar nova senha de acesso</p>
                                  </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className={cn(
                                    "rounded-2xl h-14 px-4 gap-4 font-bold cursor-pointer transition-all mb-1",
                                    user?.ativo ? 'text-orange-500 hover:bg-orange-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                                  )}
                                  onClick={() => handleToggleStatus(user.id)}
                                >
                                  <div className={cn("p-3 rounded-2xl", user?.ativo ? 'bg-orange-500/10' : 'bg-emerald-500/10')}>
                                    <Power className="size-5" />
                                  </div>
                                  <div>
                                     <p className="text-sm">{user?.ativo ? "Suspender Conta" : "Ativar Conta"}</p>
                                     <p className="text-[9px] font-bold uppercase opacity-50">{user?.ativo ? "Bloquear login imediato" : "Liberar acesso ao sistema"}</p>
                                  </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-2 bg-border/20 mx-2" />
                                
                                <DropdownMenuItem 
                                  className="rounded-2xl h-14 px-4 gap-4 font-bold cursor-pointer text-destructive hover:bg-destructive/10 transition-all focus:bg-destructive/10 focus:text-destructive"
                                  onClick={async () => {
                                    if (confirm(`Deseja realmente EXCLUIR o usuário ${user?.name}? Esta ação é IRREVERSÍVEL.`)) {
                                      try {
                                        const res = await deleteUser(user.id);
                                        if (res?.success) {
                                          toast.success("Usuário removido com sucesso");
                                          fetchData();
                                        } else {
                                          toast.error(res?.error || "Erro ao excluir usuário");
                                        }
                                      } catch {
                                        toast.error("Erro ao excluir usuário");
                                      }
                                    }
                                  }}
                                >
                                  <div className="p-3 bg-destructive/10 rounded-2xl">
                                    <Trash2 className="size-5" />
                                  </div>
                                  <div>
                                     <p className="text-sm">Excluir Permanente</p>
                                     <p className="text-[9px] font-bold uppercase opacity-50">Remover do banco de dados</p>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-40">
                           <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                              <Search className="size-20" />
                              <div className="text-center space-y-1">
                                 <h3 className="text-2xl font-black uppercase tracking-widest">Nenhum Registro</h3>
                                 <p className="text-sm font-bold">Ajuste seus filtros para encontrar resultados.</p>
                              </div>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL SECTION */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
          <div className="h-40 w-full bg-primary relative flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 opacity-90" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
             <UserPlus className="size-24 text-white/20 relative z-10" />
             <div className="absolute bottom-6 left-8 text-white z-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Novo Acesso</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Configuração de Credenciais</p>
             </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="grid gap-6">
               <div className="grid gap-2">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dados de Identificação</Label>
                 <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                      <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="rounded-2xl h-14 pl-12 bg-muted/40 border-none focus:bg-background transition-all font-bold" 
                        placeholder="Nome Completo"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                      <Input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="rounded-2xl h-14 pl-12 bg-muted/40 border-none focus:bg-background transition-all font-bold" 
                        placeholder="E-mail de Login"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                      <Input 
                        type="password"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="rounded-2xl h-14 pl-12 bg-muted/40 border-none focus:bg-background transition-all font-bold" 
                        placeholder="Senha Inicial"
                      />
                    </div>
                 </div>
               </div>

               <div className="grid gap-4">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Lotação & Hierarquia</Label>
                 <div className="grid grid-cols-2 gap-4">
                    <Select value={formData.role || undefined} onValueChange={v => setFormData({...formData, role: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/40 border-none font-bold uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="Selecionar acesso" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                         <SelectItem value="ADMIN">Administrador</SelectItem>
                         <SelectItem value="HR_STAFF">RH</SelectItem>
                         <SelectItem value="STORE_MANAGER">Gestor</SelectItem>
                         <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input 
                      value={formData.unidade} 
                      onChange={e => setFormData({...formData, unidade: e.target.value})}
                      className="h-14 rounded-2xl bg-muted/40 border-none font-bold placeholder:text-muted-foreground/30" 
                      placeholder="Unidade / Loja"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time (Opcional)</Label>
                    <Input 
                      value={formData.team} 
                      onChange={e => setFormData({...formData, team: e.target.value})}
                      className="h-14 rounded-2xl bg-muted/40 border-none font-bold placeholder:text-muted-foreground/30" 
                      placeholder="Nome do Time"
                    />
                 </div>
               </div>
            </div>

            <Button 
              onClick={handleCreateUser} 
              disabled={isSubmitting}
              className="w-full rounded-3xl h-16 font-black text-xl gap-3 shadow-2xl shadow-primary/30"
            >
              {isSubmitting ? <Loader2 className="size-7 animate-spin" /> : <Plus className="size-7" />}
              Gerar Credenciais
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL SECTION */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-2xl p-10 bg-card">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-primary/10 rounded-[1.5rem] border border-primary/20">
                  <Edit className="size-8 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase">Editar Acesso</DialogTitle>
                  <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest opacity-60">Configuração de privilégios</DialogDescription>
               </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-8">
            <div className="grid gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome de Exibição</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="rounded-2xl h-14 pl-12 bg-muted/30 border-none focus:bg-background transition-all font-bold" 
                    />
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nível de Acesso</Label>
                    <Select value={formData.role || undefined} onValueChange={v => setFormData({...formData, role: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-black uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="Selecionar acesso" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                         <SelectItem value="ADMIN">Administrador</SelectItem>
                         <SelectItem value="HR_STAFF">RH</SelectItem>
                         <SelectItem value="STORE_MANAGER">Gestor</SelectItem>
                         <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unidade / Loja</Label>
                    <Input 
                      value={formData.unidade} 
                      onChange={e => setFormData({...formData, unidade: e.target.value})}
                      className="h-14 rounded-2xl bg-muted/30 border-none font-black" 
                      placeholder="Digite a Unidade"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time (Opcional)</Label>
                  <Input 
                    value={formData.team} 
                    onChange={e => setFormData({...formData, team: e.target.value})}
                    className="h-14 rounded-2xl bg-muted/30 border-none font-black" 
                    placeholder="Digite o Time"
                  />
               </div>
            </div>

            <div className="flex gap-4 pt-4">
               <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="h-14 flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest">Cancelar</Button>
               <Button 
                onClick={handleUpdateUser} 
                disabled={isSubmitting}
                className="h-14 flex-[2] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
               >
                 {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Salvar Alterações"}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD MODAL */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
           <div className="bg-amber-500 p-8 text-white">
              <KeyRound className="size-12 mb-4 opacity-50" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Resetar Senha</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Defina o novo acesso para {selectedUser?.name}</p>
           </div>
           <div className="p-8 space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha de Acesso</Label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                    <Input 
                      type="password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="h-14 pl-12 rounded-2xl bg-muted/40 border-none font-bold"
                    />
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="ghost" onClick={() => setIsResetOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Cancelar</Button>
                 <Button 
                  onClick={handleResetPassword} 
                  disabled={isSubmitting}
                  className="flex-[2] rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white uppercase text-[10px] shadow-lg shadow-amber-500/20"
                 >
                   {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Confirmar Reset"}
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* VIEW USER MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[500px] rounded-[3.5rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
           <DialogClose className="absolute right-8 top-8 z-50 flex size-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-all outline-none">
             <X className="size-4" />
           </DialogClose>
           <div className="h-32 w-full bg-muted/30 relative flex items-center px-10">
              <div className="flex items-center gap-6 relative z-10">
                 <Avatar className="size-20 border-4 border-background shadow-2xl">
                    <AvatarImage src={selectedUser?.image} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white font-black text-2xl">{selectedUser?.name?.charAt(0)}</AvatarFallback>
                 </Avatar>
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{selectedUser?.name}</h2>
                    <Badge variant="outline" className="mt-2 bg-primary/5 text-primary border-primary/20 text-[9px] uppercase font-black tracking-widest">
                       {roleLabel[selectedUser?.role || ""]}
                    </Badge>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
           </div>

           <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">E-mail de Acesso</p>
                    <p className="font-bold text-sm flex items-center gap-2">
                       <Mail className="size-4 text-primary" />
                       {selectedUser?.email}
                    </p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status da Conta</p>
                    <div className="flex items-center gap-2">
                       <div className={cn("size-2 rounded-full", selectedUser?.ativo ? "bg-emerald-500 animate-pulse" : "bg-destructive")} />
                       <p className={cn("font-black text-[10px] uppercase tracking-widest", selectedUser?.ativo ? "text-emerald-600" : "text-destructive")}>
                          {selectedUser?.ativo ? "Habilitado" : "Bloqueado"}
                       </p>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Unidade de Lotação</p>
                    <p className="font-bold text-sm flex items-center gap-2 uppercase">
                       <Building2 className="size-4 text-primary" />
                       {selectedUser?.loja?.nome || "Sede Administrativa"}
                    </p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Time / Equipe</p>
                    <p className="font-bold text-sm flex items-center gap-2 uppercase">
                       <LayoutGrid className="size-4 text-primary" />
                       {selectedUser?.time?.nome || "Nenhum time"}
                    </p>
                 </div>
              </div>

              <div className="pt-6 border-t border-border/50 flex flex-col gap-4">
                 <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    <span>Criado em:</span>
                    <span>{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : '---'}</span>
                 </div>
                 <Button 
                   onClick={() => setIsViewOpen(false)}
                   className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                 >
                    Fechar Visualização
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
