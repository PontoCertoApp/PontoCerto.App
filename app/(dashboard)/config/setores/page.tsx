"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderKanban } from "lucide-react";
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
import { createSetor, getSetores, deleteSetor } from "@/actions/setor-actions";
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

  async function onSubmit(values: z.infer<typeof setorSchema>) {
    const result = await createSetor(values);
    if (result.success) {
      toast.success("Setor criado com sucesso!");
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
        toast.success("Setor excluído com sucesso!");
        loadSetores();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Setores</h1>
          <p className="text-muted-foreground">
            Gerencie os departamentos da empresa.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 outline-none">
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Setor</DialogTitle>
              <DialogDescription>
                Informe o nome do novo departamento.
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
                        <Input placeholder="Ex: Financeiro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
                  </TableRow>
                ))
              ) : setores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhum setor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                setores.map((setor) => (
                  <TableRow key={setor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        {setor.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(setor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
