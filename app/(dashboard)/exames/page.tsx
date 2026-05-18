"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Stethoscope, Search, Plus, AlertCircle, CheckCircle2,
  Clock, RefreshCw, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Exame {
  id: string;
  tipoExame: string;
  dataRealizacao: string;
  dataVencimento: string;
  status: string;
  documentoUrl?: string;
  colaborador: { nomeCompleto: string; cpf: string; loja: { nome: string } };
  funcao: { nome: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  VALIDO:   { label: "Válido",   color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  VENCIDO:  { label: "Vencido",  color: "bg-red-100 text-red-800",     icon: XCircle },
  PENDENTE: { label: "Pendente", color: "bg-amber-100 text-amber-800", icon: Clock },
};

const TIPO_EXAME_LABELS: Record<string, string> = {
  ASO:            "ASO",
  HEMOGRAMA:      "Hemograma",
  PARASITOLOGICO: "Parasitológico",
  TOXICOLOGICO:   "Toxicológico",
};

export default function ExamesPage() {
  const [exames, setExames]     = useState<Exame[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [openDialog, setOpenDialog]     = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    colaboradorId: "", funcaoId: "", tipoExame: "", dataRealizacao: "",
  });
  const [colaboradores, setColaboradores] = useState<{ id: string; nomeCompleto: string; funcaoId: string }[]>([]);

  async function fetchExames() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "all") params.set("status", filtroStatus);
      const res = await fetch(`/api/exames?${params}`);
      const data = await res.json();
      setExames(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchExames(); }, [filtroStatus]);
  useEffect(() => {
    fetch("/api/colaboradores/search?q=")
      .then((r) => r.json())
      .then((d) => setColaboradores(Array.isArray(d) ? d : d.items || []));
  }, []);

  async function handleSave() {
    if (!form.colaboradorId || !form.funcaoId || !form.tipoExame || !form.dataRealizacao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao registrar exame");
        return;
      }
      toast.success("Exame registrado com sucesso");
      setOpenDialog(false);
      setForm({ colaboradorId: "", funcaoId: "", tipoExame: "", dataRealizacao: "" });
      fetchExames();
    } finally {
      setSaving(false);
    }
  }

  const filtrados = exames.filter((e) =>
    e.colaborador.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    e.tipoExame.toLowerCase().includes(search.toLowerCase()) ||
    e.funcao.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totais = {
    validos:   exames.filter((e) => e.status === "VALIDO").length,
    vencidos:  exames.filter((e) => e.status === "VENCIDO").length,
    pendentes: exames.filter((e) => e.status === "PENDENTE").length,
  };

  const hoje = new Date();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="size-6 text-primary" /> Exames Médicos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ASO, Hemograma, Parasitológico, Toxicológico — controle por função
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="size-4 mr-2" /> Registrar Exame
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle2 className="size-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{totais.validos}</div>
              <div className="text-sm text-muted-foreground">Válidos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <XCircle className="size-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-red-600">{totais.vencidos}</div>
              <div className="text-sm text-muted-foreground">Vencidos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Clock className="size-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-amber-600">{totais.pendentes}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador, exame ou função..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="VALIDO">Válidos</SelectItem>
              <SelectItem value="VENCIDO">Vencidos</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={fetchExames}>
            <RefreshCw className="size-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exames</CardTitle>
          <CardDescription>{filtrados.length} registro(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Tipo de Exame</TableHead>
                  <TableHead>Realização</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum exame encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtrados.map((e) => {
                  const cfg = STATUS_CONFIG[e.status] ?? { label: e.status, color: "bg-gray-100 text-gray-700", icon: Clock };
                  const diasParaVencer = differenceInDays(new Date(e.dataVencimento), hoje);
                  const alertaVencimento = e.status === "VALIDO" && diasParaVencer <= 30;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.colaborador.nomeCompleto}</div>
                        <div className="text-xs text-muted-foreground">{e.colaborador.loja.nome}</div>
                      </TableCell>
                      <TableCell className="text-sm">{e.funcao.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {TIPO_EXAME_LABELS[e.tipoExame] || e.tipoExame}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(e.dataRealizacao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(e.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}</div>
                        {alertaVencimento && (
                          <div className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="size-3" /> vence em {diasParaVencer}d
                          </div>
                        )}
                        {e.status === "VENCIDO" && (
                          <div className="text-xs text-red-600">vencido há {Math.abs(diasParaVencer)}d</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Exame Médico</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Colaborador</Label>
              <Select value={form.colaboradorId} onValueChange={(v) => {
                const colab = colaboradores.find((c) => c.id === v);
                setForm((f) => ({ ...f, colaboradorId: v, funcaoId: colab?.funcaoId || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Exame</Label>
              <Select value={form.tipoExame} onValueChange={(v) => setForm((f) => ({ ...f, tipoExame: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_EXAME_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Realização</Label>
              <Input
                type="date"
                value={form.dataRealizacao}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((f) => ({ ...f, dataRealizacao: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Vencimento: 12 meses após a realização</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.colaboradorId || !form.tipoExame || !form.dataRealizacao}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
