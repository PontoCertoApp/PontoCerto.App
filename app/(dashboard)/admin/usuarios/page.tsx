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
  Team, 
  Edit, 
  Power, 
  Trash2, 
  Loader2,
  CheckCircle2,
  XCircle,
  Briefcase
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUsers, toggleUserAtivo, deleteUser } from "@/actions/user-actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res?.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await toggleUserAtivo(id);
      if (res?.success) {
        toast.success("Status atualizado!");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
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
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Shield className="size-10 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Controle total sobre acessos e permissões da plataforma PontoCerto.</p>
        </div>
        <Button className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/20">
          <UserPlus className="size-5" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="surface-card border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest">Total de Usuários</CardDescription>
            <CardTitle className="text-3xl font-black">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-card border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Contas Ativas</CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-500">{users.filter(u => u.ativo).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-card border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Administradores</CardDescription>
            <CardTitle className="text-3xl font-black text-primary">{users.filter(u => u.role === 'ADMIN').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-card border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-amber-500">Unidades Vinculadas</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-500">{new Set(users.map(u => u.lojaId)).size}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="surface-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou e-mail..." 
                className="pl-12 h-12 rounded-2xl bg-background border-none shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="size-12 animate-spin text-primary opacity-20" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">Sincronizando banco de dados...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14 pl-8">Usuário</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Perfil / Cargo</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Unidade / Time</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest h-14 pr-8 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={user.id} 
                      className="group border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="py-4 pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-10 border-2 border-primary/10 group-hover:scale-110 transition-transform">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="font-bold text-xs">{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-black text-[10px] tracking-tighter px-2 py-0.5 border-none shadow-sm ${
                          user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 
                          user.role === 'STORE_MANAGER' ? 'bg-amber-500/20 text-amber-500' : 
                          user.role === 'HR_STAFF' ? 'bg-indigo-500/20 text-indigo-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          {roleLabel[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Building2 className="size-3" />
                            {user.loja?.nome || "Sem Unidade"}
                          </div>
                          {user.time && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60">
                              <Briefcase className="size-3" />
                              {user.time.nome}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.ativo ? (
                          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                            <CheckCircle2 className="size-4" />
                            Ativo
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-destructive font-bold text-xs opacity-60">
                            <XCircle className="size-4" />
                            Inativo
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none surface-card">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 pt-2">Opções da Conta</DropdownMenuLabel>
                            <DropdownMenuItem className="rounded-xl h-11 px-3 gap-3 font-medium cursor-pointer">
                              <Edit className="size-4 opacity-70" />
                              Editar Cadastro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className={`rounded-xl h-11 px-3 gap-3 font-medium cursor-pointer ${user.ativo ? 'text-amber-500 focus:text-amber-500' : 'text-emerald-500 focus:text-emerald-500'}`}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <Power className="size-4" />
                              {user.ativo ? "Desativar Acesso" : "Reativar Acesso"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2 bg-border/50" />
                            <DropdownMenuItem 
                              className="rounded-xl h-11 px-3 gap-3 font-medium cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={async () => {
                                if (confirm("Deseja realmente excluir este usuário?")) {
                                  const res = await deleteUser(user.id);
                                  if (res?.success) {
                                    toast.success("Usuário excluído");
                                    fetchUsers();
                                  }
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                              Excluir Permanentemente
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
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center">
                <Search className="size-8 text-muted-foreground opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg">Nenhum usuário encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar seus termos de busca.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
