"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Building2, MapPin, Pencil, Store, Search, Loader2 } from "lucide-react";
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
import { createLoja, getLojas, deleteLoja, updateLoja } from "@/actions/loja-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface Loja {
  id: string;
  nome: string;
  cidade: string | null;
  ativo?: boolean;
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
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof lojaSchema>>({
    resolver: zodResolver(lojaSchema),
    defaultValues: {
      nome: "",
      cidade: "",
    },
  });

  async function loadLojas() {
    setIsLoading(true);
    try {
      const data = await getLojas();
      setLojas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("ERRO AO CARREGAR LOJAS:", err);
      toast.error(`Erro ao carregar unidades: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
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
      toast.success(editingId ? "Unidade atualizada!" : "Unidade criada!");
      setIsDialogOpen(false);
      form.reset();
      loadLojas();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Deseja realmente excluir esta unidade?")) {
      const result = await deleteLoja(id);
      if (result.success) {
        toast.success("Unidade removida!");
        loadLojas();
      } else {
        toast.error(result.error as string);
      }
    }
  }

  const filteredLojas = lojas.filter(l => 
    l.nome.toLowerCase().includes(search.toLowerCase()) || 
    (l.cidade || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Store className="size-10 text-primary" />
            Unidades & Lojas
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestão geográfica e administrativa da PontoCerto.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Plus className="size-5" />
            Nova Unidade
          </Button>
          <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                {editingId ? <Pencil className="size-6 text-primary" /> : <Plus className="size-6 text-primary" />}
                {editingId ? "Editar Unidade" : "Nova Unidade"}
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Preencha os dados da unidade administrativa ou loja.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 relative z-10">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Unidade</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          <Input placeholder="Ex: Sede Administrativa" {...field} className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade / Localização</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          <Input placeholder="Ex: Rio de Janeiro" {...field} className="rounded-xl h-12 pl-12 bg-muted/30 border-none focus:bg-background transition-all" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full rounded-2xl h-14 font-black text-lg gap-2 shadow-2xl shadow-primary/30">
                    {editingId ? "Salvar Alterações" : "Criar Unidade"}
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
             <CardTitle className="text-2xl font-black tracking-tight">Lista de Unidades</CardTitle>
             <CardDescription className="font-medium">Todas as sedes e lojas cadastradas no sistema.</CardDescription>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Buscar unidade ou cidade..." 
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
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 pl-10">Nome da Unidade</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16">Localização</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest h-16 text-center">Status</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest h-16 text-right pr-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell className="pl-10 py-6"><Skeleton className="h-6 w-[250px] rounded-lg" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[150px] rounded-lg" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-[80px] mx-auto rounded-full" /></TableCell>
                      <TableCell className="pr-10"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLojas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                          <Building2 className="size-16" />
                          <p className="font-bold">Nenhuma unidade encontrada</p>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLojas.map((loja) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={loja.id} 
                      className="group border-b border-border/50 hover:bg-muted/20 transition-all duration-300"
                    >
                      <TableCell className="font-black text-base pl-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-white">
                            <Building2 className="size-5" />
                          </div>
                          {loja.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-muted-foreground">
                          <MapPin className="size-4 opacity-50" />
                          {loja.cidade || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Operacional</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl transition-all"
                            onClick={() => handleEdit(loja)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            onClick={() => handleDelete(loja.id)}
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
