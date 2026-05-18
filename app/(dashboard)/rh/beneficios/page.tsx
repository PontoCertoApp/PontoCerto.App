"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  DollarSign, Search, Download, RefreshCw,
  CheckCircle2, AlertCircle, Lock,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Apuracao {
  id: string;
  competencia: string;
  valorValeBase: number;
  descontosVale: number;
  valorValeFinal: number;
  valorPontualidadeBase: number;
  descontosPontualidade: number;
  valorPontualidadeFinal: number;
  valorPremio?: number;
  zerouVale: boolean;
  zerouPontualidade: boolean;
  statusApuracao: string;
  colaborador: {
    nomeCompleto: string;
    funcao: { nome: string; setor: { nome: string } };
    loja: { nome: string };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ABERTA:    { label: "Aberta",    color: "bg-amber-100 text-amber-800" },
  FECHADA:   { label: "Fechada",   color: "bg-blue-100 text-blue-800" },
  EXPORTADA: { label: "Exportada", color: "bg-green-100 text-green-800" },
};

function fmtMoeda(v: number | undefined | null) {
  if (v === undefined || v === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

// Retorna "YYYY-MM" do mês atual
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BeneficiosPage() {
  const [apuracoes, setApuracoes] = useState<Apuracao[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [competencia, setCompetencia] = useState(mesAtual());
  const [gerando, setGerando]     = useState(false);

  async function fetchApuracoes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ competencia });
      const res = await fetch(`/api/beneficios/apuracao?${params}`);
      const data = await res.json();
      setApuracoes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchApuracoes(); }, [competencia]);

  async function handleGerar() {
    setGerando(true);
    try {
      const res = await fetch("/api/beneficios/apuracao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar apuração");
        return;
      }
      const result = await res.json();
      toast.success(`Apuração gerada: ${result.total} colaborador(es) processado(s)`);
      fetchApuracoes();
    } finally {
      setGerando(false);
    }
  }

  async function handleFechar(id: string) {
    const res = await fetch(`/api/beneficios/apuracao/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "fechar" }),
    });
    if (res.ok) { toast.success("Competência fechada"); fetchApuracoes(); }
    else toast.error("Erro ao fechar competência");
  }

  const filtradas = apuracoes.filter((a) =>
    a.colaborador.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    a.colaborador.funcao.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.colaborador.loja.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totais = {
    va: filtradas.reduce((s, a) => s + Number(a.valorValeFinal), 0),
    pont: filtradas.reduce((s, a) => s + Number(a.valorPontualidadeFinal), 0),
    zeroVale: filtradas.filter((a) => a.zerouVale).length,
    zeroPont: filtradas.filter((a) => a.zerouPontualidade).length,
  };

  // Gera lista de meses (últimos 12)
  const meses: { label: string; value: string }[] = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    meses.push({
      value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: format(m, "MMMM yyyy", { locale: ptBR }),
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="size-6 text-primary" /> Apuração de Benefícios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vale Alimentação e Pontualidade — apuração até o dia 25
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchApuracoes}>
            <RefreshCw className="size-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={handleGerar} disabled={gerando}>
            {gerando ? "Gerando..." : "Gerar Apuração"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-green-700">{fmtMoeda(totais.va)}</div>
            <div className="text-xs text-muted-foreground">Total VA a pagar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-blue-700">{fmtMoeda(totais.pont)}</div>
            <div className="text-xs text-muted-foreground">Total Pontualidade a pagar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-red-700">{totais.zeroVale}</div>
            <div className="text-xs text-muted-foreground">VA zerado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-lg font-bold text-red-700">{totais.zeroPont}</div>
            <div className="text-xs text-muted-foreground">Pontualidade zerada</div>
          </CardContent>
        </Card>
      </div>

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

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios — {meses.find((m) => m.value === competencia)?.label}</CardTitle>
          <CardDescription>{filtradas.length} colaborador(es)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="size-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma apuração para esta competência.</p>
              <p className="text-sm mt-1">Clique em "Gerar Apuração" para processar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Função / Loja</TableHead>
                  <TableHead className="text-right">VA Base</TableHead>
                  <TableHead className="text-right">Desc. VA</TableHead>
                  <TableHead className="text-right">VA Final</TableHead>
                  <TableHead className="text-right">Pont. Base</TableHead>
                  <TableHead className="text-right">Desc. Pont.</TableHead>
                  <TableHead className="text-right">Pont. Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((a) => {
                  const st = STATUS_CONFIG[a.statusApuracao] ?? { label: a.statusApuracao, color: "bg-gray-100" };
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.colaborador.nomeCompleto}</TableCell>
                      <TableCell>
                        <div className="text-sm">{a.colaborador.funcao.nome}</div>
                        <div className="text-xs text-muted-foreground">{a.colaborador.loja.nome}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmtMoeda(a.valorValeBase)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {a.zerouVale ? "ZEROU" : `-${fmtMoeda(a.descontosVale)}`}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-700">
                        {fmtMoeda(a.valorValeFinal)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmtMoeda(a.valorPontualidadeBase)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {a.zerouPontualidade ? "ZEROU" : `-${fmtMoeda(a.descontosPontualidade)}`}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-blue-700">
                        {fmtMoeda(a.valorPontualidadeFinal)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${st.color} border-0 text-xs`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.statusApuracao === "ABERTA" && (
                          <Button variant="ghost" size="sm" onClick={() => handleFechar(a.id)}>
                            <Lock className="size-3 mr-1" /> Fechar
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
    </div>
  );
}
