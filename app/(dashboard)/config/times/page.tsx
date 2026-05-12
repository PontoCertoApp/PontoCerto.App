"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createTime, getTimesAll, updateTime, toggleTimeAtivo } from "@/actions/team-actions";
import { getLojas } from "@/actions/loja-actions";

interface Time { id: string; nome: string; ativo: boolean; loja: { id: string; nome: string } }
interface Loja { id: string; nome: string }

const timeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lojaId: z.string().min(1, "Selecione uma loja"),
});

export default function TimesPage() {
  const [times, setTimes] = useState<Time[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof timeSchema>>({
    resolver: zodResolver(timeSchema),
    defaultValues: { nome: "", lojaId: "" },
  });

  async function load() {
    setIsLoading(true);
    const [t, l] = await Promise.all([getTimesAll(), getLojas()]);
    setTimes(t as Time[]);
    setLojas(l as Loja[]);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleOpenCreate() {
    setEditingId(null);
    form.reset({ nome: "", lojaId: "" });
    setIsDialogOpen(true);
  }

  function handleEdit(time: Time) {
    setEditingId(time.id);
    form.reset({ nome: time.nome, lojaId: time.loja.id });
    setIsDialogOpen(true);
  }

  async function onSubmit(values: z.infer<typeof timeSchema>) {
    const result = editingId ? await updateTime(editingId, values) : await createTime(values);
    if (result.success) {
      toast.success(editingId ? "Time atualizado!" : "Time criado!");
      setIsDialogOpen(false);
      load();
    } else {
      toast.error(result.error as string);
    }
  }

  async function handleToggle(id: string, nome: string) {
    const result = await toggleTimeAtivo(id);
    if (result.success) {
      toast.success(`Time "${nome}" atualizado.`);
      load();
    } else {
      toast.error(result.error as string);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Times</h1>
          <p className="text-muted-foreground">Gerencie os times vinculados a cada loja.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Novo Time
          </Button>
          <DialogContent className="rounded-3xl border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Time" : "Cadastrar Novo Time"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Time</FormLabel>
                    <FormControl><Input placeholder="Ex: Time 1" {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lojaId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loja</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lojas.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto rounded-xl">
                    {editingId ? "Salvar Alterações" : "Criar Time"}
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
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Loja</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="w-[100px] font-bold uppercase text-[10px] tracking-widest text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[70px]" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-5 w-[60px]" /></TableCell>
                  </TableRow>
                ))
              ) : times.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    Nenhum time cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                times.map((time) => (
                  <TableRow key={time.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{time.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{time.loja.nome}</TableCell>
                    <TableCell>
                      <Badge variant={time.ativo ? "default" : "secondary"} className="text-[10px]">
                        {time.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg" onClick={() => handleEdit(time)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-lg ${time.ativo ? "text-destructive hover:bg-destructive/10" : "text-green-500 hover:bg-green-500/10"}`}
                          onClick={() => handleToggle(time.id, time.nome)}
                        >
                          <Power className="h-3.5 w-3.5" />
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
