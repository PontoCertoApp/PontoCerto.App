"use client";

import { useEffect, useState } from "react";
import { 
  Shirt, 
  Plus, 
  Search, 
  RotateCcw, 
  AlertCircle, 
  History,
  Store,
  CheckCircle2,
  Package,
  ChevronRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { 
  getHistoricoUniformes, 
  registrarEntregaUniforme, 
  getEstoqueUniforme 
} from "@/actions/uniforme-actions";
import { getColaboradores } from "@/actions/colaborador-actions";

interface ControleUniforme {
  id: string;
  item: string;
  tamanho: string;
  dataRecebimento: string | Date;
  dataTrocaPrevista: string | Date | null;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

interface EstoqueUniforme {
  id: string;
  item: string;
  tamanho: string;
  quantidade: number;
  loja: { nome: string };
}

interface ColaboradorOption {
  id: string;
  nomeCompleto: string;
}

const itemOptions = [
  "Camiseta Polo",
  "Calça Brim",
  "Avental",
  "Boné",
  "Bota de Segurança",
  "Luvas Térmicas",
  "Outro (Especificar...)"
];

const tamanhoOptions = [
  "PP", "P", "M", "G", "GG", "XG", "G1", "G2", "G3", "36", "38", "40", "42", "44", "46", "Outro"
];

export default function UniformesPage() {
  const [historico, setHistorico] = useState<ControleUniforme[]>([]);
  const [estoque, setEstoque] = useState<EstoqueUniforme[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [selectedColabId, setSelectedColabId] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [customItem, setCustomItem] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [h, e, c] = await Promise.all([
      getHistoricoUniformes(),
      getEstoqueUniforme(),
      getColaboradores(),
    ]);
    setHistorico(h);
    setEstoque(e);
    setColaboradores(c);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit() {
    const finalItem = selectedItem === "Outro (Especificar...)" ? customItem : selectedItem;

    if (!selectedColabId || !finalItem || !tamanho) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const result = await registrarEntregaUniforme({
      colaboradorId: selectedColabId,
      item: finalItem,
      tamanho,
    });

    if (result.success) {
      toast.success("Entrega de uniforme registrada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } else {
      toast.error(result.error as string);
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setSelectedColabId("");
    setSelectedItem("");
    setCustomItem("");
    setTamanho("");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Shirt className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black">Módulo de EPI & Uniforme</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Controle de <span className="text-primary">Uniformes</span></h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Gestão de estoque e histórico de entregas por unidade</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest gap-2">
              <Plus className="h-5 w-5" />
              Entregar Uniforme
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl border-primary/20 p-8">
            <DialogHeader>
              <div className="p-3 w-fit bg-primary/10 rounded-2xl mb-2">
                <Shirt className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Registrar Entrega</DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                O sistema calculará automaticamente a data da próxima troca.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Colaborador</Label>
                 <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                   <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus:ring-primary/20">
                     <SelectValue placeholder="Selecione o colaborador">
                        {colaboradores.find(c => c.id === selectedColabId)?.nomeCompleto}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-primary/10">
                      {colaboradores.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.nomeCompleto}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Item do Uniforme</Label>
                 <Select value={selectedItem} onValueChange={setSelectedItem}>
                   <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus:ring-primary/20">
                     <SelectValue placeholder="O que está sendo entregue?" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-primary/10">
                      {itemOptions.map(opt => (
                        <SelectItem key={opt} value={opt} className="rounded-lg">{opt}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>

               {selectedItem === "Outro (Especificar...)" && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Especifique o Item</Label>
                   <Input 
                     placeholder="Ex: Colete Refletivo, Touca..." 
                     className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus-visible:ring-primary/20 font-bold uppercase text-xs"
                     value={customItem}
                     onChange={(e) => setCustomItem(e.target.value)}
                   />
                 </div>
               )}

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tamanho / Numeração (Liberdade Total)</Label>
                 <Input 
                   placeholder="Ex: M, GG, 42, Único..." 
                   className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus-visible:ring-primary/20 font-bold uppercase text-xs"
                   value={tamanho}
                   onChange={(e) => setTamanho(e.target.value)}
                 />
               </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest">
                {isSubmitting ? "Processando..." : "Confirmar Entrega"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="historico" className="space-y-6">
        <TabsList className="bg-card/50 p-1 rounded-2xl border border-primary/5 h-14 backdrop-blur-sm">
          <TabsTrigger value="historico" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <History className="mr-2 h-4 w-4" /> Histórico de Entregas
          </TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
            <Store className="mr-2 h-4 w-4" /> Estoque por Unidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="animate-in slide-in-from-bottom-4 duration-500">
           <Card className="rounded-3xl border-primary/5 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-primary/5">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-5 text-primary">Colaborador</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Item / Tamanho</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Entrega</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Troca Prevista</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Status</TableHead>
                    <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-widest text-right px-6 text-primary">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-primary/5">
                        <TableCell className="px-6 py-4"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        <TableCell className="px-6"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                      </TableRow>
                    ))
                  ) : historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                          <Package className="h-16 w-16" />
                          <div className="space-y-1">
                            <p className="font-black uppercase tracking-tighter text-xl">Sem entregas</p>
                            <p className="text-xs uppercase font-bold tracking-widest">Nenhum uniforme entregue até o momento.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((h) => {
                      const daysUntilExchange = h.dataTrocaPrevista 
                        ? differenceInDays(new Date(h.dataTrocaPrevista), new Date()) 
                        : null;
                      
                      return (
                        <TableRow key={h.id} className="group hover:bg-primary/5 transition-colors border-primary/5">
                          <TableCell className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="font-black uppercase tracking-tighter text-sm group-hover:text-primary transition-colors">{h.colaborador?.nomeCompleto}</span>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{h.colaborador?.loja?.nome}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-3">
                               <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <Shirt className="h-4 w-4" />
                               </div>
                               <span className="text-xs font-bold uppercase tracking-tight">{h.item} <span className="opacity-50 ml-1">({h.tamanho})</span></span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <span className="text-[11px] font-medium text-muted-foreground">
                               {format(new Date(h.dataRecebimento), "dd/MM/yyyy", { locale: ptBR })}
                             </span>
                          </TableCell>
                          <TableCell>
                             <span className="text-[11px] font-medium text-muted-foreground">
                               {h.dataTrocaPrevista ? format(new Date(h.dataTrocaPrevista), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                             </span>
                          </TableCell>
                          <TableCell>
                             {daysUntilExchange !== null && daysUntilExchange < 15 ? (
                               <Badge className="bg-amber-500 hover:bg-amber-600 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest gap-1">
                                 <AlertCircle className="h-3 w-3" /> Troca Próxima
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="text-green-600 border-green-200 bg-green-500/5 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest gap-1">
                                 <CheckCircle2 className="h-3 w-3" /> Em dia
                               </Badge>
                             )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90" onClick={() => toast.info("Devolução será habilitada em breve.")}>
                               <RotateCcw className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid gap-6 md:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
              ) : estoque.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center gap-4 opacity-40 border-2 border-dashed border-primary/20 rounded-[2.5rem]">
                  <Store className="h-16 w-16" />
                  <div className="text-center">
                    <p className="font-black uppercase tracking-tighter text-xl">Estoque Vazio</p>
                    <p className="text-xs uppercase font-bold tracking-widest">Favor alimentar o estoque por unidade.</p>
                  </div>
                </div>
              ) : (
                estoque.map((e) => (
                  <Card key={e.id} className="rounded-[2.5rem] border-primary/5 shadow-xl group hover:border-primary/20 transition-all">
                    <CardHeader className="pb-2">
                       <div className="flex items-center justify-between">
                         <div className="p-2 bg-primary/10 rounded-xl">
                            <Store className="h-4 w-4 text-primary" />
                         </div>
                         <Badge className="bg-muted text-foreground hover:bg-muted font-black uppercase text-[9px] tracking-widest px-3 py-1">Tam: {e.tamanho}</Badge>
                       </div>
                       <CardTitle className="text-sm font-black uppercase tracking-widest mt-4">{e.loja?.nome}</CardTitle>
                       <CardDescription className="text-xs font-bold uppercase text-primary/70">{e.item}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                       <div className="text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform">{e.quantidade}</div>
                       <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Unidades Disponíveis</div>
                    </CardContent>
                  </Card>
                ))
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
