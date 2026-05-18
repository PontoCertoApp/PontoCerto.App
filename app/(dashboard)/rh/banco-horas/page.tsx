"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Clock, Search, Plus, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface BancoHoras {
  id: string;
  competencia: string;
  horasAcumuladas: number;
  horasCompensadas: number;
  saldoHoras: number;
  tipo: string;
  observacao?: string;
  colaborador: {
    nomeCompleto: string;
    funcao: { nome: string };
    loja: { nome: string };
  };
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BancoHorasPage() {
  const [registros, setRegistros] = useState<BancoHoras[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [competencia, setCompetencia] = useState(mesAtual());
  const [openDialog, setOpenDialog]   = useState(false);
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    colaboradorId: "", competencia: mesAtual(), horasAcumuladas: 0, observacao: "",
  });

  const [colaboradores, setColaboradores] = useState<{ id: string; nomeCompleto: string }[]>([]);

  async function fetchRegistros() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ competencia });
      const res = await fetch(`/api/banco-horas?${params}`);
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRegistros(); }, [competencia]);
  useEffect(() => {
    fetch("/api/colaboradores/search?q=")
      .then((r) => r.json())
      .then((d) => setColaboradores(Array.isArray(d) ? d : d.items || []));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/banco-horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao registrar");
        return;
      }
      toast.success("Banco de horas registrado");
      setOpenDialog(false);
      fetchRegistros();
    } finally {
      setSaving(false);
    }
  }

  async function handleCompensar(id: string, horas: number) {
    const res = await fetch(`/api/banco-horas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horasCompensadas: horas }),
    });
    if (res.ok) { toast.success("Compensação registrada"); fetchRegistros(); }
    else toast.error("Erro ao registrar compensação");
  }

  const filtrados = registros.filter((r) =>
    r.colaborador.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    r.colaborador.loja.nome.toLowerCase().includes(search.toLowerCase())
  );

  const meses: { label: string; value: string }[] = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    meses.push({
      value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: format(m, "MMMM yyyy", { locale: ptBR }),
    });
  }

  const totalSaldo = filtrados.reduce((s, r) => s + Number(r.saldoHoras), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="size-6 text-primary" /> Banco de Horas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle mensal de horas acumuladas e compensadas por colaborador
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRegistros}>
            <RefreshCw className="size-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="size-4 mr-2" /> Registrar Horas
          </Button>
        </div>
      </div>

      {/* KPI */}
      <Card className="max-w-xs">
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-primary">{totalSaldo.toFixed(1)}h</div>
          <div className="text-sm text-muted-foreground">Saldo total no período</div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={competencia} onValueChange={setCompetencia}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banco de Horas — {meses.find((m) => m.value === competencia)?.label}</CardTitle>
          <CardDescription>{filtrados.length} colaborador(es)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum registro nesta competência</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Função / Loja</TableHead>
                  <TableHead className="text-right">Acumuladas</TableHead>
                  <TableHead className="text-right">Compensadas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Obs.</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.colaborador.nomeCompleto}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.colaborador.funcao.nome}</div>
                      <div className="text-xs text-muted-foreground">{r.colaborador.loja.nome}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(r.horasAcumuladas).toFixed(1)}h</TableCell>
                    <TableCell className="text-right font-mono">{Number(r.horasCompensadas).toFixed(1)}h</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${Number(r.saldoHoras) > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {Number(r.saldoHoras).toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{r.observacao || "—"}</TableCell>
                    <TableCell>
                      {Number(r.saldoHoras) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompensar(r.id, Number(r.horasAcumuladas))}
                        >
                          Compensar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Banco de Horas</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Colaborador</Label>
              <Select value={form.colaboradorId} onValueChange={(v) => setForm((f) => ({ ...f, colaboradorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Competência</Label>
              <Select value={form.competencia} onValueChange={(v) => setForm((f) => ({ ...f, competencia: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horas acumuladas</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={form.horasAcumuladas}
                onChange={(e) => setForm((f) => ({ ...f, horasAcumuladas: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Input placeholder="Opcional" value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.colaboradorId}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
