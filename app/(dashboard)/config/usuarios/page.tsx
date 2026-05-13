"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Trash2,
  Loader2,
  Mail,
  Building,
  Search,
  Plus,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getUsers,
  createUserByAdmin,
  updateUserDetails,
  toggleUserAtivo,
  deleteUser,
} from "@/actions/user-actions";
import { getLojas } from "@/actions/loja-actions";
import { getTimesAll } from "@/actions/team-actions";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  HR_STAFF: "RH",
  STORE_MANAGER: "Gestor de Loja",
  COLABORADOR: "Colaborador",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HR_STAFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  STORE_MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COLABORADOR: "bg-muted text-muted-foreground",
};

const EMPTY_CREATE = {
  name: "",
  email: "",
  password: "",
  role: "COLABORADOR",
  unidade: "",
  team: "",
};

export default function UsuariosConfigPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [allTimes, setAllTimes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ ...EMPTY_CREATE });
  const [createLoading, setCreateLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editData, setEditData] = useState({ role: "", unidade: "", team: "" });
  const [editLoading, setEditLoading] = useState(false);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  );

  const createTimes = useMemo(
    () => allTimes.filter((t) => !createData.lojaId || t.lojaId === createData.lojaId),
    [allTimes, createData.lojaId]
  );

  const editTimes = useMemo(
    () => allTimes.filter((t) => !editData.lojaId || t.lojaId === editData.lojaId),
    [allTimes, editData.lojaId]
  );

  async function loadAll() {
    setIsLoading(true);
    const [usersRes, lojasData, timesData] = await Promise.all([
      getUsers(undefined),
      getLojas(),
      getTimesAll(),
    ]);
    if (usersRes.success) setUsers(usersRes.data as any[]);
    else toast.error("Erro ao carregar usuários");
    setLojas(lojasData as any[]);
    setAllTimes(timesData as any[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate() {
    if (!createData.name.trim() || !createData.email.trim() || !createData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setCreateLoading(true);
    const res = await createUserByAdmin({
      name: createData.name,
      email: createData.email,
      password: createData.password,
      role: createData.role,
      unidade: createData.unidade || undefined,
      team: createData.team || undefined,
    });
    if (res.success) {
      toast.success("Usuário criado com sucesso!");
      setCreateOpen(false);
      setCreateData({ ...EMPTY_CREATE });
      loadAll();
    } else {
      toast.error(res.error || "Erro ao criar usuário");
    }
    setCreateLoading(false);
  }

  function openEdit(user: any) {
    setEditUser(user);
    setEditData({
      role: user.role || "COLABORADOR",
      unidade: user.loja?.nome || "",
      team: user.time?.nome || "",
    });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editUser) return;
    setEditLoading(true);
    const res = await updateUserDetails({
      userId: editUser.id,
      role: editData.role,
      unidade: editData.unidade || null,
      team: editData.team || null,
    });
    if (res.success) {
      toast.success("Usuário atualizado!");
      setEditOpen(false);
      loadAll();
    } else {
      toast.error(res.error || "Erro ao atualizar usuário");
    }
    setEditLoading(false);
  }

  async function handleToggleAtivo(userId: string) {
    const res = await toggleUserAtivo(userId);
    if (res.success) {
      toast.success("Status atualizado!");
      loadAll();
    } else {
      toast.error("Erro ao atualizar status");
    }
  }

  async function handleDelete(userId: string) {
    const res = await deleteUser(userId);
    if (res.success) {
      toast.success("Usuário removido");
      loadAll();
    } else {
      toast.error(res.error || "Erro ao remover usuário");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie quem tem acesso à plataforma PontoCerto.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Criar Usuário
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          className="pl-10 h-10 rounded-xl bg-muted/30 border-muted focus:bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="surface-card border-none premium-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users className="size-5" />
            </div>
            <div>
              <CardTitle>Contas Registradas</CardTitle>
              <CardDescription>
                {users.length} conta{users.length !== 1 ? "s" : ""} no sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-muted/50">
                <TableHead>Usuário</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((user) => {
                const isSelf = user.id === session?.user?.id;
                return (
                  <TableRow
                    key={user.id}
                    className={`hover:bg-muted/30 border-muted/30 transition-colors ${!user.ativo ? "opacity-50" : ""}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="size-3 shrink-0" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="size-3.5 shrink-0" />
                        {user.loja?.nome || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.time?.nome || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASS[user.role] || ROLE_BADGE_CLASS.COLABORADOR}`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => !isSelf && handleToggleAtivo(user.id)}
                        disabled={isSelf}
                        title={isSelf ? "Não é possível desativar sua própria conta" : undefined}
                        className="focus:outline-none"
                      >
                        <Badge
                          variant={user.ativo ? "default" : "secondary"}
                          className={`text-xs select-none ${isSelf ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-80"}`}
                        >
                          {user.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(user)}
                          title="Editar usuário"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            disabled={isSelf}
                            title={isSelf ? "Não é possível excluir sua própria conta" : undefined}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Conta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível.{" "}
                                <strong>{user.name}</strong> perderá o acesso imediatamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova conta de acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome completo *</Label>
              <Input
                value={createData.name}
                onChange={(e) => setCreateData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={createData.password}
                onChange={(e) => setCreateData((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Perfil</Label>
              <Select
                value={createData.role}
                onValueChange={(v) =>
                  setCreateData((p) => ({ ...p, role: v ?? p.role }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="HR_STAFF">RH</SelectItem>
                  <SelectItem value="STORE_MANAGER">Gestor de Loja</SelectItem>
                  <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Unidade</Label>
              <Input
                value={createData.unidade}
                onChange={(e) => setCreateData((p) => ({ ...p, unidade: e.target.value }))}
                placeholder="Nome da Unidade"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Time</Label>
              <Input
                value={createData.team}
                onChange={(e) => setCreateData((p) => ({ ...p, team: e.target.value }))}
                placeholder="Nome do Time (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {editUser?.name} — {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Perfil</Label>
              <Select
                value={editData.role}
                onValueChange={(v) =>
                  setEditData((p) => ({ ...p, role: v ?? p.role }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="HR_STAFF">RH</SelectItem>
                  <SelectItem value="STORE_MANAGER">Gestor de Loja</SelectItem>
                  <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Unidade</Label>
              <Input
                value={editData.unidade}
                onChange={(e) => setEditData((p) => ({ ...p, unidade: e.target.value }))}
                placeholder="Nome da Unidade"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Time</Label>
              <Input
                value={editData.team}
                onChange={(e) => setEditData((p) => ({ ...p, team: e.target.value }))}
                placeholder="Nome do Time (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
