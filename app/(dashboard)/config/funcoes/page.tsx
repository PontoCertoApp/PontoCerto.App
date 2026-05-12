"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Briefcase, DollarSign, Pencil, Search, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";

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
  const [search, setSearch] = useState("");

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
    try {
      const [funcoesData, setoresData] = await Promise.all([
        getFuncoes(),
        getSetores(),
      ]);
      setFuncoes(funcoesData as any);
      setSetores(setoresData);
    } catch (err) {
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
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

  const filteredFuncoes = funcoes.filter(f => 
    f.nome.toLowerCase().includes(search.toLowerCase()) || 
    f.setor.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="size-10 text-primary" />
            Cargos & Salários
          </h1>
          <p className="text-muted-foreground mt-1 font-medium italic">Definição da estrutura hierárquica e financeira.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Plus className="size-5" />
            Nova Função
          </Button>
          <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                {editingId ? <Pencil className="size-6 text-primary" /> : <Plus className="size-6 text-primary" />}
                {editingId ? "Editar Cargo" : "Novo Cargo"}
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Especifique as atribuições e o salário base.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 relative z-10">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Função</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          <Input placeholder="Ex: Analista de RH" {...field} className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="setorId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Setor Responsável</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none focus:ring-0">
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                          {setores.map((setor) => (
                            <SelectItem key={setor.id} value={setor.id} className="rounded-lg h-10 font-medium">
                              {setor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salarioBase"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Salário Base (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00"
                            className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full rounded-2xl h-14 font-black text-lg gap-2 shadow-2xl shadow-primary/30">
                    {editingId ? "Salvar Alterações" : "Criar Cargo"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="surface-card border-none shadow-2xl overflow-hidden border-t-8 border-t-primary">
        <CardHeader className="border-b bg-muted/10 pb-6 pt-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <CardTitle className="text-2xl font-black tracking-tight">Lista de Funções</CardTitle>
             <CardDescription className="font-medium">Definição de cargos e remuneração base.</CardDescription>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Buscar por cargo ou setor..." 
              className="pl-12 h-12 rounded-2xl bg-background border-none shadow-inner font-medium focus:ring-2 ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pl-10">Função / Cargo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Setor</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Remuneração Base</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest h-16 text-right pr-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell className="pl-10 py-6"><Skeleton className="h-6 w-[200px] rounded-lg" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[120px] rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px] rounded-lg" /></TableCell>
                      <TableCell className="pr-10"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredFuncoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                          <Briefcase className="size-16" />
                          <p className="font-bold">Nenhuma função encontrada</p>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuncoes.map((funcao) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={funcao.id} 
                      className="group border-b border-border/50 hover:bg-muted/20 transition-all duration-300"
                    >
                      <TableCell className="font-black text-base pl-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-white">
                            <Briefcase className="size-5" />
                          </div>
                          {funcao.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-muted-foreground font-black text-[9px] uppercase tracking-widest px-3 py-1 border-none">
                          {funcao.setor.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-black text-emerald-600 text-lg">
                          <span className="text-[10px] opacity-40">R$</span>
                          {funcao.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl transition-all"
                            onClick={() => handleEdit(funcao)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            onClick={() => handleDelete(funcao.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
