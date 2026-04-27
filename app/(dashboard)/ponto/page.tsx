"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar as CalendarIcon,
  UserX,
  ShieldAlert,
  FileText,
  Plus,
  UserCheck,
  Search,
  FileDown,
  Loader2,
  Trash2
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  registrarInconformidade,
  getTotalAtivos,
} from "@/actions/ponto-actions";

import { exportToExcel } from "@/lib/utils/export";

type TipoInconformidade = 
  | "FALTA_INJUSTIFICADA" 
  | "ATRASO" 
  | "SAIDA_ANTECIPADA" 
  | "PONTO_NAO_REGISTRADO"
  | "PRESENCA_MANUAL"
  | "FALTA_JUSTIFICADA"
  | "ATESTADO_MEDICO";

interface ColaboradorSemPonto {
  id: string;
  nomeCompleto: string;
  loja: { nome: string };
  setor: { nome: string };
}

interface RegistroPonto {
  id: string;
  tipo: TipoInconformidade;
  rapGerado: boolean;
  createdAt: string | Date;
  colaborador: { nomeCompleto: string };
}

export default function PontoPage() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const [date, setDate] = useState<Date>(new Date());
  const [pendentes, setPendentes] = useState<ColaboradorSemPonto[]>([]);
  const [tratados, setTratados] = useState<RegistroPonto[]>([]);
  const [totalColaboradores, setTotalColaboradores] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedColab, setSelectedColab] = useState<any>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tipo, setTipo] = useState<TipoInconformidade>("FALTA_INJUSTIFICADA");
  const [justificativa, setJustificativa] = useState("");
  const [gerarRap, setGerarRap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataToExport = tratados.map(t => ({
        'Colaborador': t.colaborador.nomeCompleto,
        'Inconformidade': t.tipo,
        'RAP Gerado': t.rapGerado ? "Sim" : "Não",
        'Data Ocorrência': format(new Date(date), "dd/MM/yyyy"),
        'Horário Registro': format(new Date(t.createdAt), "HH:mm")
      }));
      
      exportToExcel(dataToExport, `Relatorio_Ponto_${format(date, "dd_MM_yyyy")}`);
      toast.success("Relatório exportado!");
    } catch (error) {
      toast.error("Erro ao exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  async function loadData() {
    setIsLoading(true);
    console.log("[PONTO] Carregando dados para data:", date);
    
    try {
      // Carregar pendentes
      const p = await getColaboradoresSemPontoNoDia(date).catch((err) => {
        console.error("Erro ao buscar pendentes:", err);
        return [];
      });
      setPendentes(p as unknown as ColaboradorSemPonto[]);

      // Carregar tratados
      const t = await getInconformidadesDoDia(date).catch((err) => {
        console.error("Erro ao buscar tratados:", err);
        return [];
      });
      setTratados(t as unknown as RegistroPonto[]);

      // Carregar total ativos
      const total = await getTotalAtivos().catch((err) => {
        console.error("Erro ao buscar total ativos:", err);
        return 0;
      });
      setTotalColaboradores(total);

      // Colaboradores são buscados on-demand via /api/colaboradores/search
      // quando o usuário digita no modal — sem pré-carregamento aqui.

    } catch (error) {
      console.error("[PONTO_LOAD_FATAL_SILENCED]:", error);
      // Removed toast to eliminate user annoyance, error is handled by individual catches
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [date]);

  useEffect(() => {
    if (searchTerm.trim().length > 1 && !selectedColab) {
      setIsSearching(true);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/colaboradores/search?q=${encodeURIComponent(searchTerm)}`);
          const json = await res.json();
          if (json.success) {
            setSearchResults(json.data);
            setSearchError(null);
          } else {
            setSearchError(json.error);
          }
        } catch (err) {
          setSearchError("Erro ao buscar");
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm, selectedColab]);

  async function handleSubmit() {
    // If we have a selectedColab, use it. Otherwise, it's a manual entry using the searchTerm.
    const finalColab = selectedColab;
    
    if (!finalColab && !searchTerm.trim()) {
      toast.error("Escreva o nome do colaborador.");
      return;
    }
    
    setIsSubmitting(true);
    const result = await registrarInconformidade({
      colaboradorId: finalColab ? finalColab.id : "MANUAL",
      manualName: finalColab ? undefined : searchTerm,
      data: date,
      tipo,
      justificativa,
      gerarRap,
    });

    if (result.success) {
      toast.success("Pontuação registrada com sucesso!");
      setIsManualDialogOpen(false);
      resetForm();
      setActiveTab("tratados"); // Switch to history tab
      setTimeout(() => loadData(), 500); // Give DB a moment and refresh
    } else {
      toast.error(result.error as string);
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setTipo("PONTO_POSITIVO"); // Default to positive
    setJustificativa("");
    setGerarRap(false);
    setSelectedColab(null);
    setSearchTerm("");
  }

  const formatTipo = (t: TipoInconformidade) => {
    if (!t) return "Tipo não definido";
    const labels: Record<string, string> = {
      FALTA_INJUSTIFICADA: "Falta Injustificada (-)",
      ATRASO: "Atraso (-)",
      SAIDA_ANTECIPADA: "Saída Antecipada (-)",
      PONTO_NAO_REGISTRADO: "Ponto Não Registrado",
      PRESENCA_MANUAL: "Presença / OK (+)",
      FALTA_JUSTIFICADA: "Falta Justificada",
      ATESTADO_MEDICO: "Atestado Médico",
      PONTO_POSITIVO: "Ponto Positivo (+)",
      META_BATIDA: "Meta Batida (++)",
      ELOGIO: "Elogio (+++)",
    };
    return labels[t] || String(t).replace(/_/g, " ");
  };

  const InconformidadeBadge = (t: TipoInconformidade) => {
    if (!t) return <Badge variant="outline">Indefinido</Badge>;
    const colors: Record<string, string> = {
      FALTA_INJUSTIFICADA: "bg-red-500 shadow-sm",
      ATRASO: "bg-amber-500 shadow-sm",
      SAIDA_ANTECIPADA: "bg-orange-500 shadow-sm",
      PONTO_NAO_REGISTRADO: "bg-slate-500 shadow-sm",
      PRESENCA_MANUAL: "bg-emerald-600 shadow-sm",
      FALTA_JUSTIFICADA: "bg-indigo-500 shadow-sm",
      ATESTADO_MEDICO: "bg-purple-600 shadow-sm",
      PONTO_POSITIVO: "bg-cyan-500 shadow-sm",
      META_BATIDA: "bg-green-600 shadow-sm font-bold animate-pulse",
      ELOGIO: "bg-pink-500 shadow-sm font-bold",
    };
    return <Badge className={cn("px-2 py-0.5 whitespace-nowrap", colors[t] || "bg-gray-500")}>{formatTipo(t)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pontuação de Equipe</h1>
          <p className="text-muted-foreground">
            Gestão de pontos, méritos e benefícios.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger className={cn("flex h-9 w-[240px] items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal ring-offset-background transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => loadData()}>
            <ArrowRight className="h-4 w-4 rotate-90" />
          </Button>
          
          <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-md" onClick={() => {
                resetForm();
                loadData(); // Force refresh list
              }}>
                <Plus className="h-4 w-4 mr-2" /> Lançar Pontuação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Lançamento de Pontuação</DialogTitle>
                <DialogDescription>
                  Atribua pontos, prêmios ou registre faltas/abonos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Colaborador</Label>
                    <div className="relative mt-1">
                      <Input
                        placeholder="Digite o nome para buscar..."
                        className="pr-10"
                        value={searchTerm}
                        onChange={(e) => {
                          const term = e.target.value;
                          setSearchTerm(term);
                          // Clear selection if user edits the name
                          if (selectedColab && term !== selectedColab.nomeCompleto) {
                            setSelectedColab(null);
                          }
                        }}
                        autoComplete="off"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Dynamic API suggestions */}
                    {searchTerm.length > 0 && !selectedColab && (
                      <div className="relative">
                        {isSearching && (
                          <div className="absolute top-1 right-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        
                        {searchResults.length > 0 ? (
                          <div className="absolute z-50 w-full mt-1 border rounded-md shadow-lg bg-popover max-h-48 overflow-y-auto">
                            {searchResults.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex flex-col"
                                onClick={() => {
                                  setSelectedColab(c);
                                  setSearchTerm(c.nomeCompleto);
                                  setSearchResults([]);
                                }}
                              >
                                <span className="font-medium">{c.nomeCompleto}</span>
                                <span className="text-xs text-muted-foreground">{c.loja?.nome || "Sem Loja"} — {c.funcao?.nome || ""}</span>
                              </button>
                            ))}
                          </div>
                        ) : searchTerm.length > 2 && !isSearching && (
                          <p className="text-[10px] text-amber-500 mt-1 italic">
                            * Colaborador não encontrado. Será registrado como entrada manual com o nome digitado.
                          </p>
                        )}
                      </div>
                    )}

                    {selectedColab && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-sm">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-primary">{selectedColab.nomeCompleto}</span>
                        <button
                          type="button"
                          className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => { setSelectedColab(null); setSearchTerm(""); }}
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Lançamento</Label>
                  <Select value={tipo} onValueChange={(val) => setTipo(val as TipoInconformidade)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PONTO_POSITIVO">Ponto Positivo (+)</SelectItem>
                      <SelectItem value="META_BATIDA">Meta Batida (++)</SelectItem>
                      <SelectItem value="ELOGIO">Elogio Cliente/Equipe (+++)</SelectItem>
                      <SelectItem value="PRESENCA_MANUAL">Presença / OK (+)</SelectItem>
                      <SelectItem value="FALTA_INJUSTIFICADA">Falta Injustificada (-)</SelectItem>
                      <SelectItem value="ATRASO">Atraso (-)</SelectItem>
                      <SelectItem value="SAIDA_ANTECIPADA">Saída Antecipada (-)</SelectItem>
                      <SelectItem value="ATESTADO_MEDICO">Atestado Médico (Justificado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                    <Label>Justificativa / Motivo</Label>
                    <Textarea 
                      placeholder="Ex: Meta batida / Feedback positivo / Atestado..." 
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                    />
                  </div>
                  {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA", "PONTO_NAO_REGISTRADO"].includes(tipo) && (
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-destructive" />
                          Gerar RAP Automático?
                        </Label>
                        <p className="text-xs text-muted-foreground">Cria uma advertência no perfil.</p>
                      </div>
                      <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
                    </div>
                  )}
                </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Gravando..." : "Confirmar Lançamento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExport} disabled={isExporting || tratados.length === 0}>
            {isExporting ? <Clock className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Exportar Dia
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipe Ponto OK</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
               {totalColaboradores === 0 ? "100%" : `${Math.round(((totalColaboradores - pendentes.length) / totalColaboradores) * 100)}%`}
             </div>
             <p className="text-xs text-muted-foreground">{totalColaboradores} colaboradores ativos hoje</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Inconsistências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-amber-600">{pendentes.length}</div>
             <p className="text-xs text-muted-foreground">Aguardando tratamento manual</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Tratados Hoje</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-green-600">{tratados.length}</div>
             <p className="text-xs text-muted-foreground">Registros validados pelo RH</p>
          </CardContent>
        </Card>
      </div>

      {/* Quadro Geral Unificado */}
      <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Quadro de Performance do Dia</CardTitle>
              <CardDescription>Lista unificada de pontuações e pendências</CardDescription>
            </div>
            <Badge variant="outline" className="bg-background/50">
              {tratados.length + pendentes.length} Colaboradores
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-[300px]">Colaborador</TableHead>
                <TableHead>Loja/Setor</TableHead>
                <TableHead>Status / Pontuação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  {/* Primeiro: Mostrar os que JÁ POSSUEM PONTO (Tratados/Ganhos) */}
                  {tratados.map((registro) => (
                    <TableRow key={registro.id} className="group hover:bg-muted/40 transition-colors border-l-4 border-l-primary/50 bg-primary/5">
                      <TableCell className="font-medium py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-bold">{registro.colaborador.nomeCompleto}</span>
                          {registro.justificativa && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[250px] italic">
                              "{registro.justificativa}"
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-muted-foreground">{registro.colaborador.loja?.nome || "---"}</span>
                          <span className="opacity-60">{registro.colaborador.setor?.nome || "---"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           {InconformidadeBadge(registro.tipo as any)}
                           {registro.rapGerado && (
                             <Badge variant="destructive" className="text-[9px] h-4 px-1 animate-pulse">RAP</Badge>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Segundo: Mostrar os PENDENTES (Ainda sem ponto) */}
                  {pendentes.map((colab) => (
                    <TableRow key={colab.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium py-4">
                        <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">{colab.nomeCompleto}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                          <span>{colab.loja?.nome || "---"}</span>
                          <span>{colab.setor?.nome || "---"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50 border-dashed text-muted-foreground">
                          Aguardando Lançamento
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                              <Plus className="h-4 w-4 mr-1" /> Pontuar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Lançar Pontuação: {colab.nomeCompleto}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Tipo de Pontuação</Label>
                                <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PONTO_POSITIVO">Ponto Positivo (+)</SelectItem>
                                    <SelectItem value="META_BATIDA">Meta Batida (++)</SelectItem>
                                    <SelectItem value="ELOGIO">Elogio Cliente/Equipe</SelectItem>
                                    <SelectItem value="PRESENCA_MANUAL">Presença / OK</SelectItem>
                                    <SelectItem value="FALTA_INJUSTIFICADA">Falta Injustificada (-)</SelectItem>
                                    <SelectItem value="ATRASO">Atraso (-)</SelectItem>
                                    <SelectItem value="SAIDA_ANTECIPADA">Saída Antecipada (-)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Motivo / Observação</Label>
                                <Textarea 
                                  placeholder="Detalhes sobre a pontuação..."
                                  value={justificativa}
                                  onChange={(e) => setJustificativa(e.target.value)}
                                />
                              </div>
                              {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA", "PONTO_NAO_REGISTRADO"].includes(tipo) && (
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                                  <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                      <ShieldAlert className="h-4 w-4 text-destructive" />
                                      Gerar RAP Automático?
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Cria uma advertência no perfil.</p>
                                  </div>
                                  <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button onClick={async () => {
                                setIsSubmitting(true);
                                const res = await registrarInconformidade({
                                  colaboradorId: colab.id,
                                  data: date,
                                  tipo,
                                  justificativa,
                                  gerarRap,
                                });
                                if (res.success) {
                                  toast.success("Pontuação registrada!");
                                  resetForm();
                                  loadData();
                                }
                                setIsSubmitting(false);
                              }} disabled={isSubmitting}>
                                {isSubmitting ? "Gravando..." : "Confirmar Pontuação"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}

                  {tratados.length === 0 && pendentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                          <CheckCircle2 className="h-12 w-12" />
                          <p className="text-lg font-bold">Nenhum colaborador encontrado</p>
                          <p className="text-sm">Verifique os filtros ou a data selecionada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
