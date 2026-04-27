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
  UserCheck
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
} from "@/actions/ponto-actions";
import { TipoInconformidade } from "@/lib/enums";

export default function PontoPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [tratados, setTratados] = useState<any[]>([]);
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
      // Passamos a data atual formatada como string YYYY-MM-DD
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const data = await getInconformidadesDoDia(dateStr);
      setTratados(data);
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
        data: format(new Date(), "yyyy-MM-dd"),
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

  const formatTipo = (t: TipoInconformidade) => {
    const labels: Record<string, string> = {
      PONTO_POSITIVO: "Ponto Positivo (+)",
      META_BATIDA: "Meta Batida (++)",
      ELOGIO: "Elogio (+++)",
      PRESENCA_MANUAL: "Presença OK",
      FALTA_INJUSTIFICADA: "Falta (-)",
      ATRASO: "Atraso (-)",
      SAIDA_ANTECIPADA: "Saída Ant. (-)"
    };
    return labels[t] || String(t);
  };

  const InconformidadeBadge = (t: TipoInconformidade) => {
    const colors: Record<string, string> = {
      PONTO_POSITIVO: "bg-cyan-500",
      META_BATIDA: "bg-green-600 font-bold animate-pulse",
      ELOGIO: "bg-pink-500 font-bold",
      PRESENCA_MANUAL: "bg-emerald-600",
      FALTA_INJUSTIFICADA: "bg-red-500",
      ATRASO: "bg-amber-500",
      SAIDA_ANTECIPADA: "bg-orange-500",
    };
    return <Badge className={cn("px-2 py-0.5", colors[t] || "bg-gray-500")}>{formatTipo(t)}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Meritocracia e Performance
        </h1>
        <p className="text-muted-foreground">Sistema de pontuação e benefícios da equipe.</p>
      </div>

      {/* Área de Busca e Lançamento */}
      <Card className="border-primary/20 bg-primary/5 shadow-2xl overflow-visible">
        <CardContent className="pt-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Digite o nome para buscar e pontuar agora..." 
              className="pl-12 h-14 text-lg border-primary/20 focus:border-primary/50 shadow-sm rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {searchResults.length > 0 && !selectedColab && (
            <div className="mt-2 border rounded-xl bg-background shadow-2xl overflow-hidden z-50 relative">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/5 transition-colors border-b last:border-0"
                  onClick={() => {
                    setSelectedColab(c);
                    setIsManualDialogOpen(true);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-foreground text-base">{c.nomeCompleto}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{c.loja?.nome} • {c.funcao?.nome}</span>
                  </div>
                  <Plus className="h-6 w-6 text-primary" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico Recente */}
      <Card className="border-0 shadow-lg bg-card/40 backdrop-blur-md">
        <CardHeader className="border-b bg-muted/20 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Últimos Lançamentos</CardTitle>
            <CardDescription>Visualização em tempo real das pontuações.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="h-9">
            <Clock className="h-4 w-4 mr-2" /> Atualizar Lista
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="py-5 pl-6">Colaborador</TableHead>
                <TableHead>Pontuação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right pr-6">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-4 px-6"><Skeleton className="h-12 w-full rounded-md" /></TableCell></TableRow>
                ))
              ) : tratados.length > 0 ? (
                tratados.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-1">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{r.colaborador?.nomeCompleto || r.nomeManual || "Manual"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{r.colaborador?.loja?.nome || "Loja Geral"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{InconformidadeBadge(r.tipo as any)}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      {format(new Date(r.data), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate italic text-muted-foreground">
                      {r.justificativa || "---"}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground italic">
                    Nenhum registro encontrado no histórico de hoje.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Lançamento */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              Pontuar: {selectedColab?.nomeCompleto}
            </DialogTitle>
            <DialogDescription>Atribua um mérito ou registre uma ocorrência.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold">O que aconteceu?</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="w-full h-12 text-base border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="PONTO_POSITIVO" className="py-3">Ponto Positivo (+)</SelectItem>
                  <SelectItem value="META_BATIDA" className="py-3 font-bold text-green-600">Meta Batida (++)</SelectItem>
                  <SelectItem value="ELOGIO" className="py-3 font-bold text-pink-600">Elogio Cliente (+++)</SelectItem>
                  <SelectItem value="PRESENCA_MANUAL" className="py-3">Presença Confirmada</SelectItem>
                  <SelectItem value="FALTA_INJUSTIFICADA" className="py-3 text-red-600">Falta (-)</SelectItem>
                  <SelectItem value="ATRASO" className="py-3 text-amber-600">Atraso (-)</SelectItem>
                  <SelectItem value="SAIDA_ANTECIPADA" className="py-3 text-orange-600">Saída Antecipada (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold">Por que? (Opcional)</Label>
              <Textarea 
                placeholder="Escreva detalhes aqui..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="min-h-[100px] border-primary/10 resize-none"
              />
            </div>
            
            {["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA"].includes(tipo) && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-black text-[10px] uppercase tracking-tighter">Gerar Penalidade (RAP)?</Label>
                  <p className="text-[10px] text-muted-foreground">Isso criará uma advertência automática.</p>
                </div>
                <Switch checked={gerarRap} onCheckedChange={setGerarRap} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsManualDialogOpen(false)} className="h-12 flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 flex-1 shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Gravar Pontuação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
