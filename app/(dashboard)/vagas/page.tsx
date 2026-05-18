"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Briefcase, Plus, Search, AlertCircle, CheckCircle2,
  Clock, Building2, RefreshCw, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

interface Vaga {
  id: string;
  quantidadeMaxima: number;
  quantidadeAtual: number;
  status: string;
  dataAbertura: string;
  observacao?: string;
  funcao: { id: string; nome: string; setor: { nome: string } };
  loja: { id: string; nome: string };
}

interface Funcao { id: string; nome: string; setor: { nome: string } }
interface Loja   { id: string; nome: string }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ABERTA:     { label: "Aberta",     color: "bg-amber-100 text-amber-800" },
  PREENCHIDA: { label: "Preenchida", color: "bg-green-100 text-green-800" },
  CANCELADA:  { label: "Cancelada",  color: "bg-red-100 text-red-800" },
};

export default function VagasPage() {
  const [vagas, setVagas]       = useState<Vaga[]>([]);
  const [funcoes, setFuncoes]   = useState<Funcao[]>([]);
  const [lojas, setLojas]       = useState<Loja[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ABERTA");
  const [filtroLoja, setFiltroLoja]     = useState("all");
  const [openDialog, setOpenDialog]     = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    funcaoId: "", lojaId: "", quantidadeMaxima: 1, observacao: "",
  });

  async function fetchVagas() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "all") params.set("status", filtroStatus);
      if (filtroLoja !== "all")   params.set("lojaId", filtroLoja);
      const res = await fetch(`/api/vagas?${params}`);
      const data = await res.json();
      setVagas(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVagas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroLoja]);

  useEffect(() => {
    fetch("/api/colaboradores/search?q=&limit=0").catch(() => null);
    // Carrega funções e lojas para o formulário
    fetch("/api/vagas").then((r) => r.json()).then((data: Vaga[]) => {
      const fMap = new Map<string, Funcao>();
      const lMap = new Map<string, Loja>();
      data.forEach((v) => { fMap.set(v.funcao.id, v.funcao); lMap.set(v.loja.id, v.loja); });
      setFuncoes(Array.from(fMap.values()));
      setLojas(Array.from(lMap.values()));
    });
  }, []);

  const vagasFiltradas = vagas.filter((v) =>
    v.funcao.nome.toLowerCase().includes(search.toLowerCase()) ||
    v.loja.nome.toLowerCase().includes(search.toLowerCase()) ||
    v.funcao.setor.nome.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar vaga");
        return;
      }
      toast.success("Vaga criada com sucesso");
      setOpenDialog(false);
      setForm({ funcaoId: "", lojaId: "", quantidadeMaxima: 1, observacao: "" });
      fetchVagas();
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelar(id: string) {
    const res = await fetch(`/api/vagas/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Vaga cancelada"); fetchVagas(); }
    else toast.error("Erro ao cancelar vaga");
  }

  const totais = {
    abertas:     vagas.filter((v) => v.status === "ABERTA").length,
    preenchidas: vagas.filter((v) => v.status === "PREENCHIDA").length,
    canceladas:  vagas.filter((v) => v.status === "CANCELADA").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="size-6 text-primary" /> Controle de Vagas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão de quadro de pessoal por loja e função
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="size-4 mr-2" /> Nova Vaga
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="size-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">{totais.abertas}</div>
              <div className="text-sm text-muted-foreground">Vagas Abertas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle2 className="size-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{totais.preenchidas}</div>
              <div className="text-sm text-muted-foreground">Preenchidas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <XCircle className="size-8 text-red-400" />
            <div>
              <div className="text-2xl font-bold">{totais.canceladas}</div>
              <div className="text-sm text-muted-foreground">Canceladas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por função, setor ou loja..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ABERTA">Abertas</SelectItem>
              <SelectItem value="PREENCHIDA">Preenchidas</SelectItem>
              <SelectItem value="CANCELADA">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          {lojas.length > 0 && (
            <Select value={filtroLoja} onValueChange={setFiltroLoja}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {lojas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={fetchVagas}>
            <RefreshCw className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Vagas</CardTitle>
          <CardDescription>{vagasFiltradas.length} registro(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma vaga encontrada
                    </TableCell>
                  </TableRow>
                )}
                {vagasFiltradas.map((vaga) => {
                  const st = STATUS_LABEL[vaga.status] ?? { label: vaga.status, color: "bg-gray-100 text-gray-700" };
                  const diasAberta = Math.floor(
                    (Date.now() - new Date(vaga.dataAbertura).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <TableRow key={vaga.id}>
                      <TableCell className="font-medium">{vaga.funcao.nome}</TableCell>
                      <TableCell>{vaga.funcao.setor.nome}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3 text-muted-foreground" />
                          {vaga.loja.nome}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{vaga.quantidadeAtual}</span>
                          <span className="text-muted-foreground">/ {vaga.quantidadeMaxima}</span>
                        </div>
                        {vaga.quantidadeAtual < vaga.quantidadeMaxima && (
                          <div className="text-xs text-amber-600 font-medium">
                            {vaga.quantidadeMaxima - vaga.quantidadeAtual} em aberto
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${st.color} border-0`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(vaga.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        {vaga.status === "ABERTA" && diasAberta > 7 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <Clock className="size-3" /> {diasAberta}d aberta
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {vaga.status === "ABERTA" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelar(vaga.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Vaga */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Vaga</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Função</Label>
              {funcoes.length > 0 ? (
                <Select value={form.funcaoId} onValueChange={(v) => setForm((f) => ({ ...f, funcaoId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcoes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome} — {f.setor.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="ID da função (não há funções carregadas)"
                  value={form.funcaoId}
                  onChange={(e) => setForm((f) => ({ ...f, funcaoId: e.target.value }))}
                />
              )}
            </div>
            <div>
              <Label>Loja</Label>
              {lojas.length > 0 ? (
                <Select value={form.lojaId} onValueChange={(v) => setForm((f) => ({ ...f, lojaId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="ID da loja"
                  value={form.lojaId}
                  onChange={(e) => setForm((f) => ({ ...f, lojaId: e.target.value }))}
                />
              )}
            </div>
            <div>
              <Label>Quantidade de vagas</Label>
              <Input
                type="number"
                min={1}
                value={form.quantidadeMaxima}
                onChange={(e) => setForm((f) => ({ ...f, quantidadeMaxima: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Input
                placeholder="Opcional"
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.funcaoId || !form.lojaId}>
              {saving ? "Salvando..." : "Criar Vaga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
