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
  Pencil,
  Gift,
  ArrowRight,
  Sparkles,
  History,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";
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
  atualizarInconformidade,
  getPontoStats
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
  const [stats, setStats] = useState({ media: 0, crescimento: 0 });

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
      const [registros, topPerformers, realStats] = await Promise.all([
        getInconformidadesDoDia(new Date()),
        getLeaderboard(),
        getPontoStats()
      ]);
      setTratados(registros);
      setLeaderboard(topPerformers);
      setStats(realStats);
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

  const formatLabel = (t: string) => {
    if (!t) return "";
    return t.replaceAll("_", " ");
  };

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
      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter shadow-sm", colors[t])}>
        {formatLabel(t)} {sign}{val}
      </Badge>
    );
  };

  return (
    <div className="relative space-y-10 max-w-6xl mx-auto p-4 pb-20 overflow-hidden min-h-screen">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* HEADER ELITE */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-xl">
               <Trophy className="h-7 w-7 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest px-4">Performance Module</Badge>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-foreground">Clube de Performance</h1>
            <p className="text-muted-foreground text-lg font-medium italic opacity-70 mt-2">Transformando disciplina em reconhecimento estratégico.</p>
          </div>
        </div>

        <div className="flex gap-4">
           <Card className="glass-card border-none shadow-2xl px-6 py-4 flex items-center gap-4 group">
              <div className="p-3 bg-primary/10 rounded-xl transition-transform group-hover:scale-110">
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Média Equipe</p>
                <p className="text-3xl font-black tracking-tighter">{stats.media}</p>
              </div>
           </Card>
           <Card className="glass-card border-none shadow-2xl px-6 py-4 flex items-center gap-4 group">
              <div className="p-3 bg-emerald-500/10 rounded-xl transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Crescimento</p>
                <p className={cn("text-3xl font-black tracking-tighter", stats.crescimento >= 0 ? "text-emerald-500" : "text-destructive")}>
                  {stats.crescimento > 0 ? `+${stats.crescimento}%` : `${stats.crescimento}%`}
                </p>
              </div>
           </Card>
        </div>
      </motion.div>

      {/* PODIUM GLASSMORPHISM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-[2.5rem] bg-muted/20" />)
        ) : (
          leaderboard.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group"
            >
              <Card 
                className={cn(
                  "relative overflow-hidden border-none transition-all shadow-2xl rounded-[2.5rem] cursor-pointer h-full",
                  idx === 0 ? "bg-gradient-to-br from-yellow-500/20 via-background to-background border-t-4 border-t-yellow-500" : 
                  idx === 1 ? "bg-gradient-to-br from-slate-400/20 via-background to-background border-t-4 border-t-slate-400" : 
                  "bg-gradient-to-br from-orange-600/20 via-background to-background border-t-4 border-t-orange-600"
                )}
                onClick={() => {
                  setSelectedColab({ id: player.id, nomeCompleto: player.nome, loja: { nome: player.loja } });
                  setIsManualDialogOpen(true);
                }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                   {idx === 0 ? <Medal className="size-32" /> : <Award className="size-32" />}
                </div>
                
                <CardContent className="pt-8 pb-8 flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className={cn(
                        "h-20 w-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl transition-transform group-hover:rotate-6",
                        idx === 0 ? "bg-yellow-500 text-black" : 
                        idx === 1 ? "bg-slate-400 text-black" : 
                        "bg-orange-600 text-white"
                      )}>
                        {player.nome.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-card rounded-2xl p-1.5 border shadow-xl flex items-center justify-center">
                         {idx === 0 ? <Trophy className="h-6 w-6 text-yellow-500" /> : <Star className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-xl tracking-tighter uppercase truncate group-hover:text-primary transition-colors">{player.nome}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-1">{player.loja}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-lg px-3 tracking-tighter">
                          {player.pontos} <span className="text-[10px] ml-1 opacity-60">PTS</span>
                        </Badge>
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{player.vitorias} Méritos</span>
                      </div>
                    </div>
                  </div>

                  {player.pontos >= 100 ? (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl bg-primary/10 border-primary/20 hover:bg-primary hover:text-white transition-all font-black text-xs uppercase group h-12 shadow-lg shadow-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/premios?colabId=${player.id}&tipo=RESGATE_PONTOS`;
                      }}
                    >
                      <Gift className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                      Resgatar Benefício
                      <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </Button>
                  ) : (
                    <div className="w-full h-12 rounded-2xl border-2 border-dashed border-muted flex items-center justify-center opacity-40">
                       <span className="text-[10px] font-black uppercase tracking-widest">Aguardando {100 - player.pontos} pts</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* SEARCH BAR PREMIUM */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-50 max-w-3xl mx-auto"
      >
        <div className={cn(
          "bg-card/40 backdrop-blur-3xl border-2 border-primary/10 rounded-[2.5rem] p-4 shadow-2xl transition-all group focus-within:border-primary/40 focus-within:shadow-primary/5",
          searchTerm.length > 2 && "rounded-b-none border-b-0"
        )}>
           <div className="flex items-center gap-5 px-4">
              <div className="p-3 bg-primary/10 rounded-2xl group-focus-within:scale-110 transition-transform">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <Input 
                placeholder="Qual talento vamos reconhecer agora?"
                className="border-0 bg-transparent text-xl h-14 focus-visible:ring-0 placeholder:text-muted-foreground/30 font-black uppercase tracking-tight"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border/50">
                 <Zap className="size-4 text-amber-500" />
                 <span className="text-[10px] font-black uppercase opacity-40">Quick Merit</span>
              </div>
           </div>
        </div>

        {/* RESULTS DROPDOWN */}
        <AnimatePresence>
          {searchResults.length > 0 && !selectedColab && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-card/95 backdrop-blur-3xl border-2 border-t-0 border-primary/10 rounded-b-[2.5rem] shadow-2xl overflow-hidden z-[100]"
            >
              <div className="p-3">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-primary/10 transition-all rounded-[1.5rem] group/item mb-1"
                    onClick={() => {
                      setSelectedColab(c);
                      setIsManualDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center font-black text-xl group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all shadow-inner">
                        {c.nomeCompleto.charAt(0)}
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-black text-lg uppercase tracking-tight group-hover/item:text-primary transition-colors">{c.nomeCompleto}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/10">{c.loja?.nome}</Badge>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">{c.setor?.nome || "Geral"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase opacity-0 group-hover/item:opacity-40 tracking-widest">Selecionar</span>
                       <ChevronRight className="h-6 w-6 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-4 group-hover/item:translate-x-0" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FEED & HISTORY ELITE */}
      <Card className="surface-card border-none shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-primary/20">
        <CardHeader className="bg-muted/10 py-10 px-12 border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <History className="size-4 text-primary opacity-50" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Operations</span>
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase leading-none">Histórico de Performance</CardTitle>
            <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-50">Auditoria completa de méritos e inconformidades</CardDescription>
          </div>
          <Button variant="outline" onClick={loadData} className="rounded-2xl h-14 w-14 p-0 border-primary/10 hover:bg-primary/5">
             <Activity className="h-6 w-6 text-primary" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-0 h-16">
                  <TableHead className="pl-12 font-black uppercase text-[10px] tracking-widest text-muted-foreground/50">Colaborador em Foco</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/50">Mérito / Registro</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/50">Cronologia</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/50">Contextualização</TableHead>
                  <TableHead className="text-right pr-12 font-black uppercase text-[10px] tracking-widest text-muted-foreground/50">Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5} className="py-6 px-12"><Skeleton className="h-14 w-full rounded-2xl" /></TableCell></TableRow>
                  ))
                ) : tratados.length > 0 ? (
                  <AnimatePresence>
                    {tratados.map((r) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={r.id} 
                        className="border-b border-border/10 last:border-0 hover:bg-primary/[0.03] transition-all group cursor-pointer"
                        onClick={() => handleEdit(r)}
                      >
                        <TableCell className="py-6 pl-12">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center font-black text-lg text-foreground/80 border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all shadow-sm">
                              {r.colaborador?.nomeCompleto?.charAt(0) || "M"}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="font-black text-base uppercase tracking-tight group-hover:text-primary transition-colors">{r.colaborador?.nomeCompleto || r.nomeManual}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/10 opacity-60">{r.colaborador?.loja?.nome || "Sede Adm"}</Badge>
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{r.colaborador?.setor?.nome || "Geral"}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{InconformidadeBadge(r.tipo as any)}</TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase text-foreground/70">{format(new Date(r.data), "dd MMM yy", { locale: ptBR })}</span>
                              <span className="text-[9px] font-bold text-muted-foreground opacity-50 italic">Registrado hoje</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="max-w-[240px] p-3 rounded-xl bg-muted/30 border border-border/40 group-hover:bg-background transition-all">
                              <p className="text-[10px] italic font-bold opacity-60 leading-snug">
                                {r.justificativa ? `"${r.justificativa}"` : "Sem observações adicionais."}
                              </p>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-12" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20">
                              <Pencil className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-40 text-center">
                       <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                          <Activity className="size-16" />
                          <h3 className="text-2xl font-black uppercase tracking-widest">Silêncio no Ponto</h3>
                          <p className="text-sm font-bold">Nenhum mérito ou atraso registrado hoje.</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL ELITE PARA CRIAR/EDITAR */}
      <Dialog open={isManualDialogOpen} onOpenChange={(val) => {
        setIsManualDialogOpen(val);
        if (!val) resetForm();
      }}>
        <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-0 overflow-hidden shadow-2xl border-0 bg-card">
          <div className={cn(
            "px-10 py-10 text-white flex flex-col gap-2 relative overflow-hidden",
            editingId ? "bg-gradient-to-br from-amber-600 to-orange-700" : "bg-gradient-to-br from-primary to-indigo-700"
          )}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
             <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                   <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                  {editingId ? "Ajustar Mérito" : "Novo Reconhecimento"}
                </h2>
             </div>
             <div className="flex items-center gap-3 mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10">
                <div className="h-12 w-12 rounded-xl bg-white text-primary flex items-center justify-center font-black text-xl shadow-xl">
                   {selectedColab?.nomeCompleto?.charAt(0)}
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Alvo do Mérito</p>
                   <p className="text-base font-black uppercase leading-tight tracking-tight">{selectedColab?.nomeCompleto}</p>
                </div>
             </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tipo de Evolução</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="w-full h-16 border-none bg-muted/40 rounded-2xl uppercase font-black text-xs tracking-widest focus:ring-2 ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="PONTO_POSITIVO" className="rounded-xl h-12 font-bold mb-1">Ponto Positivo (+10)</SelectItem>
                  <SelectItem value="META_BATIDA" className="rounded-xl h-12 font-black text-green-600 mb-1">Meta Batida (+50)</SelectItem>
                  <SelectItem value="ELOGIO" className="rounded-xl h-12 font-black text-purple-600 mb-1">Elogio Master (+100)</SelectItem>
                  <SelectItem value="PRESENCA_MANUAL" className="rounded-xl h-12 font-bold mb-1">Presença Confirmada (+5)</SelectItem>
                  <div className="my-2 h-px bg-border/50" />
                  <SelectItem value="FALTA_INJUSTIFICADA" className="rounded-xl h-12 font-black text-red-600 mb-1">Falta Injustificada (-50)</SelectItem>
                  <SelectItem value="ATRASO" className="rounded-xl h-12 font-black text-amber-600 mb-1">Atraso Operacional (-10)</SelectItem>
                  <SelectItem value="SAIDA_ANTECIPADA" className="rounded-xl h-12 font-black text-orange-600">Saída Antecipada (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nota do Gestor</Label>
              <Textarea 
                placeholder="Descreva o motivo deste reconhecimento ou inconformidade de forma detalhada..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="min-h-[120px] border-none bg-muted/40 rounded-2xl resize-none focus:ring-2 ring-primary/20 text-sm font-medium p-6"
              />
            </div>
            
            {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA"].includes(tipo) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-6 rounded-[2rem] bg-destructive/5 border-2 border-destructive/10 shadow-inner"
              >
                <div className="space-y-1">
                  <Label className="text-destructive font-black text-xs uppercase tracking-widest">Gerar Penalidade (RAP)?</Label>
                  <p className="text-[10px] font-bold text-muted-foreground opacity-70 italic leading-tight">Este registro criará uma advertência oficial.</p>
                </div>
                <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
              </motion.div>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setIsManualDialogOpen(false)} className="h-16 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className={cn(
                "h-16 flex-[2] rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                editingId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-primary shadow-primary/30"
              )}>
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : editingId ? "Atualizar" : "Registrar Mérito"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
