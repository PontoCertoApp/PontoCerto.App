"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Building2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { createLoja, getLojas, deleteLoja, updateLoja } from "@/actions/loja-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface Loja {
  id: string;
  nome: string;
  cidade: string | null;
}

const lojaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
});

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof lojaSchema>>({
    resolver: zodResolver(lojaSchema),
    defaultValues: {
      nome: "",
      cidade: "",
    },
  });

  async function loadLojas() {
    setIsLoading(true);
    const data = await getLojas();
    setLojas(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadLojas();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    form.reset({ nome: "", cidade: "" });
    setIsDialogOpen(true);
  }

  function handleEdit(loja: Loja) {
    setEditingId(loja.id);
    form.reset({
      nome: loja.nome,
      cidade: loja.cidade || "",
    });
    setIsDialogOpen(true);
  }

  async function onSubmit(values: z.infer<typeof lojaSchema>) {
    let result;
    if (editingId) {
      result = await updateLoja(editingId, values);
    } else {
      result = await createLoja(values);
    }

    if (result.success) {
      toast.success(editingId ? "Loja atualizada!" : "Loja criada!");
      setIsDialogOpen(false);
      form.reset();
      loadLojas();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta loja?")) {
      const result = await deleteLoja(id);
      if (result.success) {
        toast.success("Loja excluída!");
        loadLojas();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lojas</h1>
          <p className="text-muted-foreground">
            Gerencie as unidades da empresa com total autonomia.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            Nova Loja
          </Button>
          <DialogContent className="rounded-3xl border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Loja" : "Cadastrar Nova Loja"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifique os dados da unidade selecionada." : "Preencha os dados da nova unidade."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Loja</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Loja Centro" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto rounded-xl">
                    {editingId ? "Salvar Alterações" : "Criar Loja"}
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
                <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6">Nome</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Cidade</TableHead>
                <TableHead className="w-[120px] font-bold uppercase text-[10px] tracking-widest text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[80px]" /></TableCell>
                  </TableRow>
                ))
              ) : lojas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                    Nenhuma loja cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                lojas.map((loja) => (
                  <TableRow key={loja.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{loja.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <MapPin className="h-4 w-4 text-primary/50" />
                        <span className="text-xs font-semibold">{loja.cidade || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => handleEdit(loja)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(loja.id)}
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
