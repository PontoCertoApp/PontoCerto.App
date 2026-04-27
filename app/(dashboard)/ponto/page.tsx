"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  Search,
  Plus,
  Loader2,
  Trash2,
  Trophy,
  UserCheck,
  Star,
  TrendingUp,
  Award,
  Medal,
  ChevronRight
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { 
  registrarInconformidade, 
  getInconformidadesDoDia, 
  getLeaderboard
} from "@/actions/ponto-actions";
import { TipoInconformidade } from "@/lib/enums";

export default function PontoPage() {
  const [tratados, setTratados] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedColab, setSelectedColab] = useState<any>(null);

  const [tipo, setTipo] = useState<TipoInconformidade>("PONTO_POSITIVO");
  const [justificativa, setJustificativa] = useState("");
  const [gerarRap, setGerarRap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2 && !selectedColab) {
      setIsSearching(true);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/colaboradores/search?q=${searchTerm}`);
          const json = await res.json();
          if (json.success) setSearchResults(json.data);
        } catch (err) {
          console.error("Erro na busca:", err);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
    }
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchTerm, selectedColab]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [registros, topPerformers] = await Promise.all([
        getInconformidadesDoDia(undefined as any),
        getLeaderboard()
      ]);
      setTratados(registros);
      setLeaderboard(topPerformers);
    } catch (error) {
      console.error("[PONTO_LOAD_ERROR]:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedColab && !searchTerm.trim()) {
      toast.error("Selecione um colaborador.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registrarInconformidade({
        colaboradorId: selectedColab?.id || "MANUAL",
        nomeManual: selectedColab ? undefined : searchTerm,
        data: new Date(),
        tipo,
        justificativa,
        gerarRap
      });

      if (res.success) {
        toast.success("Pontuação registrada com sucesso!");
        setIsManualDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(res.error as string);
      }
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setTipo("PONTO_POSITIVO");
    setJustificativa("");
    setGerarRap(false);
    setSelectedColab(null);
    setSearchTerm("");
  }

  const getPointsValue = (t: TipoInconformidade) => {
    const values: Record<string, number> = {
      PONTO_POSITIVO: 10,
      META_BATIDA: 50,
      ELOGIO: 100,
      PRESENCA_MANUAL: 5,
      FALTA_INJUSTIFICADA: -50,
      ATRASO: -10,
      SAIDA_ANTECIPADA: -10
    };
    return values[t] || 0;
  };

  const InconformidadeBadge = (t: TipoInconformidade) => {
    const colors: Record<string, string> = {
      PONTO_POSITIVO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      META_BATIDA: "bg-green-500/20 text-green-400 border-green-500/30",
      ELOGIO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      PRESENCA_MANUAL: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      FALTA_INJUSTIFICADA: "bg-red-500/20 text-red-400 border-red-500/30",
      ATRASO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      SAIDA_ANTECIPADA: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    const val = getPointsValue(t);
    const sign = val > 0 ? "+" : "";
    
    return (
      <Badge variant="outline" className={cn("px-3 py-1 font-bold", colors[t])}>
        {t.replace("_", " ")} {sign}{val} pts
      </Badge>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 pb-20">
      {/* Header Gamificado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Clube de Performance</h1>
              <p className="text-muted-foreground font-medium italic">Reconhecendo os talentos do Ponto Certo.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
           <Card className="bg-primary/5 border-primary/20 shadow-lg px-4 py-2 flex items-center gap-3">
              <Star className="h-6 w-6 text-primary fill-primary" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Média Global</p>
                <p className="text-xl font-black">94.2</p>
              </div>
           </Card>
           <Card className="bg-green-500/5 border-green-500/20 shadow-lg px-4 py-2 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Crescimento</p>
                <p className="text-xl font-black">+12%</p>
              </div>
           </Card>
        </div>
      </div>

      {/* Podium / Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)
        ) : (
          leaderboard.map((player, idx) => (
            <Card 
              key={player.id} 
              className={cn(
                "relative overflow-hidden border-2 transition-all hover:scale-[1.02] cursor-default",
                idx === 0 ? "border-yellow-500/50 bg-yellow-500/5" : 
                idx === 1 ? "border-slate-400/50 bg-slate-400/5" : 
                "border-orange-600/50 bg-orange-600/5"
              )}
            >
              <div className="absolute -top-2 -right-2 opacity-10">
                 <Medal className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
                 <div className="relative">
                    <div className={cn(
                      "h-20 w-20 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl",
                      idx === 0 ? "bg-yellow-500 text-black" : 
                      idx === 1 ? "bg-slate-400 text-black" : 
                      "bg-orange-600 text-white"
                    )}>
                      {player.nome.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border shadow-sm">
                       {idx === 0 ? <Award className="h-6 w-6 text-yellow-500" /> : <Star className="h-6 w-6 text-muted-foreground" />}
                    </div>
                 </div>
                 <div>
                    <h3 className="font-black text-lg tracking-tight uppercase">{player.nome}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{player.loja}</p>
                 </div>
                 <div className="bg-background/80 backdrop-blur px-4 py-1 rounded-full border shadow-sm flex items-center gap-2">
                    <span className="font-black text-primary">{player.pontos} pts</span>
                    <span className="text-[10px] uppercase font-bold opacity-50">{player.vitorias} méritos</span>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Área de Busca Centralizada (Estilo Apple/Figma) */}
      <div className="relative z-50">
        <div className={cn(
          "bg-background border-2 border-primary/20 rounded-[2rem] p-3 shadow-2xl transition-all group focus-within:border-primary/50",
          searchTerm.length > 2 && "rounded-b-none border-b-0"
        )}>
           <div className="flex items-center gap-4 px-4">
              <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Quem você quer reconhecer hoje? Digite o nome..."
                className="border-0 bg-transparent text-xl h-14 focus-visible:ring-0 placeholder:text-muted-foreground/50 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
           </div>
        </div>

        {/* Dropdown de Resultados Gourmet */}
        {searchResults.length > 0 && !selectedColab && (
          <div className="absolute top-full left-0 right-0 bg-background border-2 border-t-0 border-primary/20 rounded-b-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-all rounded-2xl group/item"
                  onClick={() => {
                    setSelectedColab(c);
                    setIsManualDialogOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center font-bold text-lg group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                      {c.nomeCompleto.charAt(0)}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-lg group-hover/item:text-primary transition-colors">{c.nomeCompleto}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">{c.loja?.nome} • {c.funcao?.nome}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-all translate-x-[-10px] group-hover/item:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed de Performance */}
      <Card className="border-0 shadow-2xl bg-card/20 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/30 py-6 px-8 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">Feed de Excelência</CardTitle>
              <CardDescription className="font-medium italic">Monitoramento em tempo real da performance.</CardDescription>
            </div>
            <Button variant="ghost" onClick={loadData} className="rounded-full h-12 w-12 p-0">
               <Clock className="h-6 w-6" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-0">
                <TableHead className="py-6 pl-8 font-black uppercase text-[10px] tracking-widest opacity-50">Talento</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest opacity-50">Mérito/Ocorrência</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest opacity-50">Data</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest opacity-50">Contexto</TableHead>
                <TableHead className="text-right pr-8 font-black uppercase text-[10px] tracking-widest opacity-50">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-6 px-8"><Skeleton className="h-14 w-full rounded-2xl" /></TableCell></TableRow>
                ))
              ) : tratados.length > 0 ? (
                tratados.map((r) => (
                  <TableRow key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {r.colaborador?.nomeCompleto?.charAt(0) || "M"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight">{r.colaborador?.nomeCompleto || r.nomeManual}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.colaborador?.loja?.nome || "Loja Geral"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{InconformidadeBadge(r.tipo as any)}</TableCell>
                    <TableCell className="text-xs font-black opacity-60">
                      {format(new Date(r.data), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs max-w-[250px] truncate italic font-medium opacity-70">
                      "{r.justificativa || "Reconhecimento de rotina"}"
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-full">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-80 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                    <div className="p-6 bg-muted rounded-full opacity-20">
                      <Star className="h-16 w-16" />
                    </div>
                    <p className="text-lg font-bold">Nenhum reconhecimento registrado ainda.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Lançamento High-End */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-primary px-8 py-10 text-primary-foreground flex flex-col gap-2">
             <div className="flex items-center gap-3">
                <Award className="h-10 w-10 text-yellow-400" />
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Novo Reconhecimento</h2>
             </div>
             <p className="opacity-80 font-medium">Você está pontuando <span className="font-black text-white">{selectedColab?.nomeCompleto}</span></p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest opacity-50">Impacto na Performance</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="w-full h-14 text-lg border-2 border-primary/10 rounded-2xl focus:border-primary/50 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="PONTO_POSITIVO" className="py-4 font-bold">Ponto Positivo (+10 pts)</SelectItem>
                  <SelectItem value="META_BATIDA" className="py-4 font-black text-green-600 italic underline decoration-2">Meta Batida (+50 pts)</SelectItem>
                  <SelectItem value="ELOGIO" className="py-4 font-black text-purple-600 italic">Elogio Cliente (+100 pts)</SelectItem>
                  <SelectItem value="PRESENCA_MANUAL" className="py-4 font-bold">Presença OK (+5 pts)</SelectItem>
                  <DropdownMenuSeparator />
                  <SelectItem value="FALTA_INJUSTIFICADA" className="py-4 font-bold text-red-600">Falta (-50 pts)</SelectItem>
                  <SelectItem value="ATRASO" className="py-4 font-bold text-amber-600">Atraso (-10 pts)</SelectItem>
                  <SelectItem value="SAIDA_ANTECIPADA" className="py-4 font-bold text-orange-600">Saída Ant. (-10 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest opacity-50">O que motivou isso? (Opcional)</Label>
              <Textarea 
                placeholder="Descreva o motivo deste reconhecimento para inspirar a equipe..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="min-h-[120px] border-2 border-primary/10 rounded-2xl resize-none focus:border-primary/50 text-base"
              />
            </div>
            
            {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA"].includes(tipo) && (
              <div className="flex items-center justify-between p-5 rounded-[2rem] bg-destructive/5 border-2 border-destructive/10">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-black text-xs uppercase tracking-tight">Gerar Advertência Oficial?</Label>
                  <p className="text-[10px] font-bold text-muted-foreground opacity-70">Será enviado para o dossiê de penalidades.</p>
                </div>
                <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button variant="ghost" onClick={() => setIsManualDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest">
                Descartar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Gravar e Pontuar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper types if missing in your project
const DropdownMenuSeparator = () => <div className="h-px bg-muted my-2" />;
