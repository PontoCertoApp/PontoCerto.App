"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Briefcase, DollarSign } from "lucide-react";
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
import { createFuncao, getFuncoes, deleteFuncao } from "@/actions/funcao-actions";
import { getSetores } from "@/actions/setor-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Funcao {
  id: string;
  nome: string;
  salarioBase: number;
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
    setFuncoes(funcoesData);
    setSetores(setoresData);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(values: z.infer<typeof funcaoSchema>) {
    const result = await createFuncao(values);
    if (result.success) {
      toast.success("Função criada com sucesso!");
      setIsDialogOpen(false);
      form.reset();
      loadData();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta função?")) {
      const result = await deleteFuncao(id);
      if (result.success) {
        toast.success("Função excluída com sucesso!");
        loadData();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funções</h1>
          <p className="text-muted-foreground">
            Gerencie os cargos e salários base.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Função
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Função</DialogTitle>
              <DialogDescription>
                Defina os detalhes do cargo.
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
                        <Input placeholder="Ex: Vendedor" {...field} />
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
                      <FormLabel>Setor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
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
                <TableHead>Função</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Salário Base</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
                  </TableRow>
                ))
              ) : funcoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma função cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                funcoes.map((funcao) => (
                  <TableRow key={funcao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {funcao.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{funcao.setor.nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {funcao.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(funcao.id)}
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
