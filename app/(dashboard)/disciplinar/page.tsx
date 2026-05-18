"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Search, Plus, ChevronDown,
  Clock, CheckCircle2, XCircle, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Penalidade {
  id: string;
  tipo: string;
  descricao: string;
  motivo?: string;
  diasSuspensao?: number;
  contadorMotivo: number;
  proximoNivel?: string;
  dataOcorrencia: string;
  status: string;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
  motivoPreCadastrado?: { texto: string };
}

interface MotivoPreCadastrado { id: string; texto: string; categoria: string }
interface Colaborador         { id: string; nomeCompleto: string }

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  INCONSISTENCIA_PONTO: { label: "Inconsistência de Ponto",  color: "bg-yellow-100 text-yellow-800" },
  QUEDA_CONDUTA:        { label: "Termo de Conduta (AC)",    color: "bg-orange-100 text-orange-800" },
  ADVERTENCIA:          { label: "Advertência",              color: "bg-red-100 text-red-800" },
  SUSPENSAO:            { label: "Suspensão",                color: "bg-red-200 text-red-900" },
  JUSTA_CAUSA:          { label: "Justa Causa",              color: "bg-red-300 text-red-950" },
};

export default function DisciplinarPage() {
  const [penalidades, setPenalidades] = useState<Penalidade[]>([]);
  const [motivos, setMotivos]         = useState<MotivoPreCadastrado[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("all");
  const [openDialog, setOpenDialog]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [motivoError, setMotivoError] = useState("");

  const [form, setForm] = useState({
    colaboradorId: "",
    tipo: "",
    motivoPreCadastradoId: "",
    motivoTexto: "",
    descricao: "",
    diasSuspensao: 1,
  });

  const motivosFiltrados = motivos.filter((m) => m.categoria === mapTipoToCategoria(form.tipo));

  function mapTipoToCategoria(tipo: string) {
    const map: Record<string, string> = {
      INCONSISTENCIA_PONTO: "INCONSISTENCIA_PONTO",
      QUEDA_CONDUTA:        "TERMO_CONDUTA",
      ADVERTENCIA:          "ADVERTENCIA",
      SUSPENSAO:            "SUSPENSAO",
    };
    return map[tipo] || "";
  }

  const fetchPenalidades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo !== "all") params.set("tipo", filtroTipo);
      const res = await fetch(`/api/penalidades?${params}`).catch(() => null);
      if (!res) return;
      const data = await res.json();
      setPenalidades(Array.isArray(data) ? data : data.items || []);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    fetchPenalidades();
    fetch("/api/disciplinar/motivos").then((r) => r.json()).then(setMotivos);
    fetch("/api/colaboradores/search?q=")
      .then((r) => r.json())
      .then((d) => setColaboradores(Array.isArray(d) ? d : d.items || []));
  }, [fetchPenalidades]);

  async function handleSave() {
    setMotivoError("");
    const motivo = form.motivoTexto.trim();
    if (motivo.length < 50) {
      setMotivoError("Descreva o motivo detalhadamente antes de salvar. (mínimo 50 caracteres)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        colaboradorId: form.colaboradorId,
        tipo: form.tipo,
        motivoTexto: motivo,
        motivoPreCadastradoId: form.motivoPreCadastradoId || undefined,
        descricao: form.descricao || motivo.slice(0, 200),
        diasSuspensao: form.tipo === "SUSPENSAO" ? form.diasSuspensao : undefined,
      };

      const res = await fetch("/api/disciplinar/progressao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao registrar penalidade");
        if (err.error?.includes("mínimo")) setMotivoError(err.error);
        return;
      }

      const result = await res.json();
      toast.success(
        `Penalidade registrada — Ocorrência #${result.contadorAtual}` +
        (result.proximoNivel ? ` | Próximo nível: ${result.proximoNivel}` : "")
      );
      setOpenDialog(false);
      setForm({ colaboradorId: "", tipo: "", motivoPreCadastradoId: "", motivoTexto: "", descricao: "", diasSuspensao: 1 });
      fetchPenalidades();
    } finally {
      setSaving(false);
    }
  }

  const penalidadesFiltradas = penalidades.filter((p) =>
    p.colaborador.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="size-6 text-primary" /> Gestão Disciplinar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Inconsistências, Termos de Conduta, Advertências e Suspensões
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="size-4 mr-2" /> Registrar Ocorrência
        </Button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(TIPO_LABEL).map(([tipo, cfg]) => {
          const cnt = penalidades.filter((p) => p.tipo === tipo && p.status === "ATIVA").length;
          return (
            <Card key={tipo}>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">{cnt}</div>
                <Badge className={`${cfg.color} border-0 text-xs mt-1`}>{cfg.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador ou descrição..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TIPO_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Ocorrências Disciplinares</CardTitle>
          <CardDescription>{penalidadesFiltradas.length} registro(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ocorrência #</TableHead>
                  <TableHead>Próximo nível</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalidadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma ocorrência encontrada
                    </TableCell>
                  </TableRow>
                )}
                {penalidadesFiltradas.map((p) => {
                  const cfg = TIPO_LABEL[p.tipo] ?? { label: p.tipo, color: "bg-gray-100 text-gray-700" };
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.colaborador.nomeCompleto}</div>
                        <div className="text-xs text-muted-foreground">{p.colaborador.loja.nome}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                        {p.diasSuspensao && (
                          <div className="text-xs text-muted-foreground mt-1">{p.diasSuspensao} dia(s)</div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-64">
                        <div className="truncate text-sm">{p.descricao}</div>
                        {p.motivoPreCadastrado && (
                          <div className="text-xs text-primary mt-1">{p.motivoPreCadastrado.texto}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg">{p.contadorMotivo}</span>
                        <span className="text-muted-foreground text-xs"> ocorrência(s)</span>
                      </TableCell>
                      <TableCell>
                        {p.proximoNivel ? (
                          <div className="text-xs font-medium text-red-700 bg-red-50 rounded px-2 py-1 border border-red-200">
                            {p.proximoNivel}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(p.dataOcorrencia), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {p.status === "ATIVA"     && <CheckCircle2 className="size-4 text-green-500" />}
                        {p.status === "CANCELADA" && <XCircle      className="size-4 text-red-400" />}
                        {p.status === "VENCIDA"   && <Clock        className="size-4 text-gray-400" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Registrar Ocorrência */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Ocorrência Disciplinar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Colaborador</Label>
              <Select value={form.colaboradorId} onValueChange={(v) => setForm((f) => ({ ...f, colaboradorId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Ocorrência</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v, motivoPreCadastradoId: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.tipo === "SUSPENSAO" && (
              <div>
                <Label>Dias de Suspensão</Label>
                <Select
                  value={String(form.diasSuspensao)}
                  onValueChange={(v) => setForm((f) => ({ ...f, diasSuspensao: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 7].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} dia{d > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chips de motivo pré-cadastrado */}
            {form.tipo && motivosFiltrados.length > 0 && (
              <div>
                <Label className="mb-2 block">Motivo pré-cadastrado (opcional — selecione um)</Label>
                <div className="flex flex-wrap gap-2">
                  {motivosFiltrados.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        motivoPreCadastradoId: f.motivoPreCadastradoId === m.id ? "" : m.id,
                        motivoTexto: f.motivoPreCadastradoId === m.id ? "" : (f.motivoTexto || m.texto),
                      }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        form.motivoPreCadastradoId === m.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border hover:bg-muted/80"
                      }`}
                    >
                      {m.texto}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de motivo obrigatório */}
            <div>
              <Label>
                Motivo detalhado <span className="text-red-500">*</span>{" "}
                <span className="text-muted-foreground text-xs">(mínimo 50 caracteres)</span>
              </Label>
              <Textarea
                placeholder="Descreva detalhadamente o motivo da ocorrência..."
                rows={4}
                value={form.motivoTexto}
                onChange={(e) => {
                  setForm((f) => ({ ...f, motivoTexto: e.target.value }));
                  setMotivoError("");
                }}
              />
              <div className="flex justify-between mt-1">
                {motivoError
                  ? <span className="text-xs text-red-600">{motivoError}</span>
                  : <span />}
                <span className={`text-xs ${form.motivoTexto.length < 50 ? "text-muted-foreground" : "text-green-600"}`}>
                  {form.motivoTexto.length}/50
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.colaboradorId || !form.tipo || form.motivoTexto.trim().length < 50}
            >
              {saving ? "Registrando..." : "Registrar Ocorrência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
