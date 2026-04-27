"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Briefcase, DollarSign, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFuncao, getFuncoes, deleteFuncao, updateFuncao } from "@/actions/funcao-actions";
import { getSetores } from "@/actions/setor-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Funcao {
  id: string;
  nome: string;
  salarioBase: number;
  setorId: string;
  setor: { nome: string };
}

interface Setor {
  id: string;
  nome: string;
}

const funcaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  setorId: z.string().min(1, "Selecione um setor"),
  salarioBase: z.number().min(0, "Salário deve ser positivo"),
});

export default function FuncoesPage() {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof funcaoSchema>>({
    resolver: zodResolver(funcaoSchema),
    defaultValues: {
      nome: "",
      setorId: "",
      salarioBase: 0,
    },
  });

  async function loadData() {
    setIsLoading(true);
    const [funcoesData, setoresData] = await Promise.all([
      getFuncoes(),
      getSetores(),
    ]);
    setFuncoes(funcoesData as any);
    setSetores(setoresData);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    form.reset({ nome: "", setorId: "", salarioBase: 0 });
    setIsDialogOpen(true);
  }

  function handleEdit(funcao: Funcao) {
    setEditingId(funcao.id);
    form.reset({
      nome: funcao.nome,
      setorId: funcao.setorId,
      salarioBase: funcao.salarioBase,
    });
    setIsDialogOpen(true);
  }

  async function onSubmit(values: z.infer<typeof funcaoSchema>) {
    let result;
    if (editingId) {
      result = await updateFuncao(editingId, values);
    } else {
      result = await createFuncao(values);
    }

    if (result.success) {
      toast.success(editingId ? "Cargo atualizado!" : "Cargo criado!");
      setIsDialogOpen(false);
      form.reset();
      loadData();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
      const result = await deleteFuncao(id);
      if (result.success) {
        toast.success("Cargo excluído!");
        loadData();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funções <span className="text-primary">&</span> Cargos</h1>
          <p className="text-muted-foreground">
            Gerencie os cargos, salários base e atribuições de setor.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            Nova Função
          </Button>
          <DialogContent className="rounded-3xl border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifique as informações do cargo selecionado." : "Preencha os detalhes para criar um novo cargo."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vendedor" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="setorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor Responsável</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {setores.map((setor) => (
                            <SelectItem key={setor.id} value={setor.id}>
                              {setor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="salarioBase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Base (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            className="pl-9 rounded-xl"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full sm:w-auto rounded-xl">
                    {editingId ? "Salvar Alterações" : "Criar Cargo"}
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
                <TableHead className="font-bold uppercase text-[10px] tracking-widest px-6 py-4 text-primary">Função / Cargo</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-primary">Setor</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-primary">Salário Base</TableHead>
                <TableHead className="w-[120px] font-bold uppercase text-[10px] tracking-widest text-right px-6 text-primary">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[80px]" /></TableCell>
                  </TableRow>
                ))
              ) : funcoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    Nenhum cargo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                funcoes.map((funcao) => (
                  <TableRow key={funcao.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{funcao.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-black tracking-widest">
                        {funcao.setor.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-bold text-emerald-600">
                        <span className="text-[10px] opacity-60">R$</span>
                        {funcao.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => handleEdit(funcao)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(funcao.id)}
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
