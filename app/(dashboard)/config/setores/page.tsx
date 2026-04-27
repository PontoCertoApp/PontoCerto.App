"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderKanban, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSetor, getSetores, deleteSetor, updateSetor } from "@/actions/setor-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface Setor {
  id: string;
  nome: string;
}

const setorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof setorSchema>>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      nome: "",
    },
  });

  async function loadSetores() {
    setIsLoading(true);
    const data = await getSetores();
    setSetores(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadSetores();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    form.reset({ nome: "" });
    setIsDialogOpen(true);
  }

  function handleEdit(setor: Setor) {
    setEditingId(setor.id);
    form.reset({
      nome: setor.nome,
    });
    setIsDialogOpen(true);
  }

  async function onSubmit(values: z.infer<typeof setorSchema>) {
    let result;
    if (editingId) {
      result = await updateSetor(editingId, values);
    } else {
      result = await createSetor(values);
    }

    if (result.success) {
      toast.success(editingId ? "Setor atualizado!" : "Setor criado!");
      setIsDialogOpen(false);
      form.reset();
      loadSetores();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este setor?")) {
      const result = await deleteSetor(id);
      if (result.success) {
        toast.success("Setor excluído!");
        loadSetores();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Setores <span className="text-primary">&</span> Departamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os departamentos da empresa para organizar as funções.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
          </Button>
          <DialogContent className="rounded-3xl border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Setor" : "Novo Setor"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Altere o nome do departamento selecionado." : "Informe o nome do novo departamento."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Financeiro" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full sm:w-auto rounded-xl">
                    {editingId ? "Salvar Alterações" : "Criar Setor"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-3xl border-primary/5 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6 py-4 text-primary">Nome do Setor</TableHead>
                <TableHead className="w-[120px] font-bold uppercase text-[10px] tracking-widest text-right px-6 text-primary">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[250px]" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[80px]" /></TableCell>
                  </TableRow>
                ))
              ) : setores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground italic">
                    Nenhum setor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                setores.map((setor) => (
                  <TableRow key={setor.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{setor.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => handleEdit(setor)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(setor.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
