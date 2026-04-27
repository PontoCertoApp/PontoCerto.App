"use client";

import { useEffect, useState, Suspense } from "react";
import { 
  Plus, 
  Search, 
  Gift, 
  Calendar, 
  CheckCircle2, 
  TrendingUp,
  DollarSign,
  UserCheck,
  ChevronRight,
  Filter,
  Package,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getPremios, createPremio } from "@/actions/premio-actions";
import { getColaboradores } from "@/actions/colaborador-actions";

interface Premio {
  id: string;
  tipo: string;
  valorFinal: number;
  dataReferencia: string | Date;
  status: string;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

interface ColaboradorOption {
  id: string;
  nomeCompleto: string;
  loja: { nome: string };
}

const prizeTypes = [
  "Meta de Venda",
  "Campanha Local",
  "Bônus Escalonado",
  "Prêmio Cota Individual",
  "Vale-Alimentação",
  "Resgate de Pontos (Meritocracia)",
  "Outro (Especificar...)"
];

export default function PremiosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <PremiosContent />
    </Suspense>
  );
}

function PremiosContent() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({ totalPremiado: 0, pctComPremio: 0 });

  // Form State
  const [selectedColabId, setSelectedColabId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const [valor, setValor] = useState("0");
  const [obs, setObs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  async function loadData() {
    setIsLoading(true);
    const [p, c] = await Promise.all([
      getPremios(),
      getColaboradores(),
    ]);
    setPremios(p);
    setColaboradores(c);

    // Calc simple stats
    const total = p.reduce((acc, curr) => acc + curr.valorFinal, 0);
    setStats({
      totalPremiado: total,
      pctComPremio: c.length > 0 ? (p.length / c.length) * 100 : 0
    });
    
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const colabId = searchParams.get("colaboradorId");
    if (colabId) {
      setSelectedColabId(colabId);
      setSelectedType("Resgate de Pontos (Meritocracia)");
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const filtered = premios.filter(p => 
    (p.colaborador?.nomeCompleto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.tipo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleSubmit() {
    const finalType = selectedType === "Outro (Especificar...)" ? customType : selectedType;

    if (!selectedColabId || !finalType || !valor) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPremio({
      colaboradorId: selectedColabId,
      tipo: finalType,
      valorOriginal: parseFloat(valor),
      valorFinal: parseFloat(valor),
      dataReferencia: new Date(),
      observacao: obs,
    });

    if (result.success) {
      toast.success("Prêmio concedido com sucesso!");
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
    setSelectedType("");
    setCustomType("");
    setValor("0");
    setObs("");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black">Módulo de Recompensa</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Prêmios & <span className="text-primary">Benefícios</span></h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Gestão de bônus, metas e incentivos financeiros</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest gap-2">
              <Plus className="h-5 w-5" />
              Conceder Prêmio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl border-primary/20 p-8">
            <DialogHeader>
              <div className="p-3 w-fit bg-primary/10 rounded-2xl mb-2">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Novo Lançamento</DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                O bônus será refletido na próxima folha de pagamento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Colaborador Elegível</Label>
                 <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                   <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus:ring-primary/20">
                     <SelectValue placeholder="Quem receberá o prêmio?">
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
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tipo de Incentivo</Label>
                 <Select value={selectedType} onValueChange={setSelectedType}>
                   <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus:ring-primary/20">
                     <SelectValue placeholder="Selecione o tipo de prêmio" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-primary/10">
                      {prizeTypes.map(t => (
                        <SelectItem key={t} value={t} className="rounded-lg">{t}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>

               {selectedType === "Outro (Especificar...)" && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Especifique o Tipo</Label>
                   <Input 
                     placeholder="Ex: Prêmio Produtividade Extra..." 
                     className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus-visible:ring-primary/20 font-bold uppercase text-xs"
                     value={customType}
                     onChange={(e) => setCustomType(e.target.value)}
                   />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Valor (R$)</Label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40">R$</span>
                     <Input 
                       type="number" 
                       className="h-12 pl-10 rounded-2xl bg-muted/20 border-primary/10 focus-visible:ring-primary/20 font-black text-sm"
                       value={valor} 
                       onChange={(e) => setValor(e.target.value)} 
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Competência</Label>
                   <Input 
                     type="text" 
                     disabled
                     className="h-12 rounded-2xl bg-muted/20 border-primary/10 font-bold text-xs"
                     value={format(new Date(), "MMMM / yyyy", { locale: ptBR })}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Observação Interna</Label>
                 <Input 
                   placeholder="Detalhes adicionais..." 
                   className="h-12 rounded-2xl bg-muted/20 border-primary/10 focus-visible:ring-primary/20 text-xs font-medium"
                   value={obs} 
                   onChange={(e) => setObs(e.target.value)} 
                 />
               </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest">
                {isSubmitting ? "Lançando..." : "Confirmar Lançamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[2rem] border-primary/5 shadow-xl bg-primary text-primary-foreground relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
            <DollarSign size={150} />
          </div>
          <CardHeader>
            <CardDescription className="text-primary-foreground/60 font-black uppercase text-[10px] tracking-widest">Total Premiado (Mês)</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPremiado)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border-primary/5 shadow-xl bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
          <CardHeader>
            <CardDescription className="font-black uppercase text-[10px] tracking-widest opacity-40">Engajamento de Metas</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter flex items-end gap-2 text-primary">
              {stats.pctComPremio.toFixed(1)}%
              <span className="text-xs font-bold text-muted-foreground uppercase pb-1.5 opacity-60 tracking-widest font-sans">da equipe</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border-primary/5 shadow-xl bg-card/50 backdrop-blur-sm flex items-center justify-center p-6 border-dashed">
          <div className="text-center space-y-2 opacity-40">
             <TrendingUp className="h-10 w-10 mx-auto" />
             <p className="text-[10px] font-black uppercase tracking-widest">Filtros Avançados em Breve</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-primary/5 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between bg-muted/30">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
             </div>
             <Input 
                placeholder="BUSCAR POR COLABORADOR OU TIPO..." 
                className="border-none bg-transparent font-black uppercase text-xs tracking-widest focus-visible:ring-0 w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent border-primary/5">
                <TableHead className="font-black text-[10px] uppercase tracking-widest px-8 py-5 text-primary">Colaborador</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Incentivo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-center">Data</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-right">Valor</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary text-right px-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    <TableCell className="px-8 py-4"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell className="px-8"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <Package className="h-16 w-16" />
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tighter text-xl">Sem registros</p>
                        <p className="text-xs uppercase font-bold tracking-widest">Nenhum prêmio lançado com esses critérios.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-primary/5 transition-colors border-primary/5">
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-col">
                         <span className="font-black uppercase tracking-tighter text-sm group-hover:text-primary transition-colors">{p.colaborador?.nomeCompleto}</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{p.colaborador?.loja?.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Gift className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight">{p.tipo}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className="text-[11px] font-medium text-muted-foreground uppercase">
                         {format(new Date(p.dataReferencia), "dd MMM yyyy", { locale: ptBR })}
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-sm">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valorFinal)}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-500/5 px-3 py-1 text-[10px] uppercase font-black tracking-widest gap-1">
                         <CheckCircle2 className="h-3 w-3" /> {p.status}
                       </Badge>
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
