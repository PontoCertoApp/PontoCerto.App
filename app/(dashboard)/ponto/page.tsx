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
  ChevronRight,
  Pencil
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
  getLeaderboard,
  excluirInconformidade,
  atualizarInconformidade
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

  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!selectedColab && !searchTerm.trim() && !editingId) {
      toast.error("Selecione um colaborador.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await atualizarInconformidade(editingId, {
          tipo,
          justificativa,
          gerarRap
        });
        if (res.success) {
          toast.success("Pontuação atualizada!");
          setIsManualDialogOpen(false);
          resetForm();
          loadData();
        } else {
          toast.error(res.error as string);
        }
      } else {
        const res = await registrarInconformidade({
          colaboradorId: selectedColab?.id || "MANUAL",
          nomeManual: selectedColab ? undefined : searchTerm,
          data: new Date(),
          tipo,
          justificativa,
          gerarRap
        });

        if (res.success) {
          toast.success("Pontuação registrada!");
          setIsManualDialogOpen(false);
          resetForm();
          loadData();
        } else {
          toast.error(res.error as string);
        }
      }
    } catch (err) {
      toast.error("Erro ao processar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente remover este lançamento?")) return;
    try {
      const res = await excluirInconformidade(id);
      if (res.success) {
        toast.success("Removido com sucesso");
        loadData();
      } else {
        toast.error("Erro ao remover");
      }
    } catch (err) {
      toast.error("Erro fatal ao remover");
    }
  }

  function handleEdit(registro: any) {
    setEditingId(registro.id);
    setSelectedColab(registro.colaborador || { nomeCompleto: registro.nomeManual });
    setTipo(registro.tipo as any);
    setJustificativa(registro.justificativa || "");
    setGerarRap(registro.rapGerado);
    setIsManualDialogOpen(true);
  }

  function resetForm() {
    setTipo("PONTO_POSITIVO");
    setJustificativa("");
    setGerarRap(false);
    setSelectedColab(null);
    setSearchTerm("");
    setEditingId(null);
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
      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter", colors[t])}>
        {t.replace("_", " ")} {sign}{val}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 pb-20">
      {/* Header Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Clube de Performance</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Reconhecendo Talentos</p>
          </div>
        </div>

        <div className="flex gap-2">
           <Card className="bg-primary/5 border-primary/20 shadow-sm px-3 py-1.5 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <div className="leading-tight">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Média</p>
                <p className="text-sm font-black">94.2</p>
              </div>
           </Card>
           <Card className="bg-green-500/5 border-green-500/20 shadow-sm px-3 py-1.5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="leading-tight">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Crescimento</p>
                <p className="text-sm font-black">+12%</p>
              </div>
           </Card>
        </div>
      </div>

      {/* Podium Compacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          leaderboard.map((player, idx) => (
            <Card 
              key={player.id} 
              className={cn(
                "relative overflow-hidden border transition-all hover:border-primary/60 hover:scale-[1.03] cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.98]",
                idx === 0 ? "border-yellow-500/30 bg-yellow-500/5" : 
                idx === 1 ? "border-slate-400/30 bg-slate-400/5" : 
                "border-orange-600/30 bg-orange-600/5"
              )}
              onClick={() => {
                setSelectedColab({ id: player.id, nomeCompleto: player.nome, loja: { nome: player.loja } });
                setIsManualDialogOpen(true);
              }}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-4">
                 <div className="relative">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center text-lg font-black shadow-lg",
                      idx === 0 ? "bg-yellow-500 text-black" : 
                      idx === 1 ? "bg-slate-400 text-black" : 
                      "bg-orange-600 text-white"
                    )}>
                      {player.nome.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border shadow-sm">
                       {idx === 0 ? <Award className="h-4 w-4 text-yellow-500" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                    </div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm tracking-tight uppercase truncate">{player.nome}</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{player.loja}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-xs text-primary">{player.pontos} pts</span>
                      <span className="text-[9px] font-bold opacity-40 uppercase">{player.vitorias} méritos</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Busca Compacta */}
      <div className="relative z-50">
        <div className={cn(
          "bg-background border border-primary/20 rounded-2xl p-2 shadow-xl transition-all group focus-within:border-primary/50",
          searchTerm.length > 2 && "rounded-b-none border-b-0"
        )}>
           <div className="flex items-center gap-3 px-3">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              <Input 
                placeholder="Quem você quer reconhecer hoje?"
                className="border-0 bg-transparent text-base h-10 focus-visible:ring-0 placeholder:text-muted-foreground/40 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
           </div>
        </div>

        {/* Dropdown Compacto */}
        {searchResults.length > 0 && !selectedColab && (
          <div className="absolute top-full left-0 right-0 bg-background border border-t-0 border-primary/20 rounded-b-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
            <div className="p-1">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 transition-all rounded-xl group/item"
                  onClick={() => {
                    setSelectedColab(c);
                    setIsManualDialogOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                      {c.nomeCompleto.charAt(0)}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-sm group-hover/item:text-primary transition-colors">{c.nomeCompleto}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{c.loja?.nome}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-all translate-x-[-5px] group-hover/item:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed Compacto */}
      <Card className="border shadow-lg bg-card/20 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 py-3 px-6 border-b flex flex-row items-center justify-between">
          <div className="leading-tight">
            <CardTitle className="text-base font-black uppercase tracking-tighter">Histórico</CardTitle>
            <CardDescription className="text-[10px] font-medium italic">Monitoramento em tempo real.</CardDescription>
          </div>
          <Button variant="ghost" onClick={loadData} className="rounded-full h-8 w-8 p-0">
             <Clock className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-0">
                <TableHead className="py-3 pl-6 font-black uppercase text-[9px] tracking-widest opacity-40">Talento</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest opacity-40">Mérito</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest opacity-40">Data</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-widest opacity-40">Contexto</TableHead>
                <TableHead className="text-right pr-6 font-black uppercase text-[9px] tracking-widest opacity-40">Gestão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-3 px-6"><Skeleton className="h-10 w-full rounded-lg" /></TableCell></TableRow>
                ))
              ) : tratados.length > 0 ? (
                tratados.map((r) => (
                  <TableRow 
                    key={r.id} 
                    className="border-b last:border-0 hover:bg-primary/5 transition-colors group cursor-pointer active:bg-primary/10"
                    onClick={() => handleEdit(r)}
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center font-bold text-[10px] text-primary border border-primary/10">
                          {r.colaborador?.nomeCompleto?.charAt(0) || "M"}
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="font-bold text-xs uppercase tracking-tight truncate max-w-[120px]">{r.colaborador?.nomeCompleto || r.nomeManual}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">{r.colaborador?.loja?.nome || "---"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{InconformidadeBadge(r.tipo as any)}</TableCell>
                    <TableCell className="text-[10px] font-bold opacity-60">
                      {format(new Date(r.data), "dd MMM yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-[10px] max-w-[180px] truncate italic font-medium opacity-60">
                      {r.justificativa ? `"${r.justificativa}"` : "---"}
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="h-7 w-7 rounded-full hover:text-primary">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="h-7 w-7 rounded-full hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-bold opacity-40">Nenhum registro hoje.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Reutilizável para Criar/Editar */}
      <Dialog open={isManualDialogOpen} onOpenChange={(val) => {
        setIsManualDialogOpen(val);
        if (!val) resetForm();
      }}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
          <div className={cn(
            "px-6 py-6 text-white flex flex-col gap-1 transition-colors",
            editingId ? "bg-amber-600" : "bg-primary"
          )}>
             <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-white/80" />
                <h2 className="text-xl font-black tracking-tighter uppercase leading-none">
                  {editingId ? "Editar Lançamento" : "Novo Mérito"}
                </h2>
             </div>
             <p className="text-[11px] font-bold uppercase opacity-80">
               Colaborador: <span className="text-white">{selectedColab?.nomeCompleto}</span>
             </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Tipo de Performance</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="w-full h-11 border-2 border-primary/5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="PONTO_POSITIVO">Ponto Positivo (+10)</SelectItem>
                  <SelectItem value="META_BATIDA" className="font-bold text-green-600">Meta Batida (+50)</SelectItem>
                  <SelectItem value="ELOGIO" className="font-bold text-purple-600">Elogio (+100)</SelectItem>
                  <SelectItem value="PRESENCA_MANUAL">Presença (+5)</SelectItem>
                  <SelectItem value="FALTA_INJUSTIFICADA" className="text-red-600">Falta (-50)</SelectItem>
                  <SelectItem value="ATRASO" className="text-amber-600">Atraso (-10)</SelectItem>
                  <SelectItem value="SAIDA_ANTECIPADA" className="text-orange-600">Saída (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Observação</Label>
              <Textarea 
                placeholder="Por que este reconhecimento?"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="min-h-[80px] border-2 border-primary/5 rounded-xl resize-none focus:border-primary/20 text-sm"
              />
            </div>
            
            {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA"].includes(tipo) && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-destructive/5 border border-destructive/10">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-black text-[9px] uppercase">Gerar Penalidade?</Label>
                  <p className="text-[8px] font-bold text-muted-foreground opacity-70 italic">Advertência oficial no sistema.</p>
                </div>
                <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsManualDialogOpen(false)} className="h-11 flex-1 rounded-xl font-bold uppercase text-[10px]">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className={cn(
                "h-11 flex-1 rounded-xl font-black uppercase text-[10px] shadow-lg",
                editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-primary shadow-primary/20"
              )}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar Alterações" : "Gravar Agora"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
