"use client";

import { useState, useMemo, Suspense } from "react";
import { 
  Download, 
  Loader2, 
  Calendar, 
  FileText, 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Gift, 
  Shirt,
  Search,
  ChevronRight,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  getRelatorioColaboradoresExperiencia,
  getRelatorioDocumentacaoPendente,
  getRelatorioHistoricoPenalidades,
  getRelatorioFolhaPremios,
  getRelatorioControleUniformes,
  getRelatorioPGF,
} from "@/actions/relatorio-actions";

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { label: format(d, "MMMM yyyy", { locale: ptBR }), value: format(d, "yyyy-MM") };
  });
}

export default function RelatoriosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <RelatoriosContent />
    </Suspense>
  );
}

function RelatoriosContent() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const monthOptions = getMonthOptions();

  const getDateRange = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const ref = new Date(year, month - 1, 1);
    return { start: startOfMonth(ref), end: endOfMonth(ref) };
  };

  const handleExport = async (key: string, name: string) => {
    setLoadingReport(key);
    const id = toast.loading(`Gerando relatório: ${name}...`);
    
    try {
      const { start, end } = getDateRange();
      const label = format(start, "yyyy-MM");

      switch (key) {
        case "experiencia": {
          const data = await getRelatorioColaboradoresExperiencia();
          if (!data.length) { toast.dismiss(id); toast.info("Nenhum colaborador em experiência no momento."); break; }
          downloadCSV(`experiencia-${label}.csv`,
            data.map(c => [c.nomeCompleto, c.funcao.nome, c.setor.nome, c.loja.nome, format(new Date(c.createdAt), "dd/MM/yyyy")]),
            ["Nome", "Função", "Setor", "Loja", "Início"]);
          toast.success("Relatório gerado com sucesso!", { id });
          break;
        }
        case "documentos": {
          const data = await getRelatorioDocumentacaoPendente();
          if (!data.length) { toast.dismiss(id); toast.info("Nenhuma documentação pendente."); break; }
          downloadCSV(`documentos-pendentes-${label}.csv`,
            data.map(d => [d.colaborador.nomeCompleto, d.colaborador.loja.nome, d.nome, format(new Date(d.createdAt), "dd/MM/yyyy")]),
            ["Colaborador", "Loja", "Documento", "Data"]);
          toast.success("Relatório gerado com sucesso!", { id });
          break;
        }
        case "pgf": {
          const data = await getRelatorioPGF(start, end);
          if (!data.length) { toast.dismiss(id); toast.info("Nenhum registro de ponto no período."); break; }
          downloadCSV(`pgf-consolidado-${label}.csv`,
            data.map(r => [r.colaborador.nomeCompleto, r.colaborador.loja.nome, r.tipo || "---", format(new Date(r.data), "dd/MM/yyyy"), r.justificativa || "---"]),
            ["Colaborador", "Loja", "Tipo", "Data", "Justificativa"]);
          toast.success("PGF exportado com sucesso!", { id });
          break;
        }
        case "penalidades": {
          const data = await getRelatorioHistoricoPenalidades(start, end);
          if (!data.length) { toast.dismiss(id); toast.info("Nenhuma penalidade (RAP) no período."); break; }
          downloadCSV(`historico-rap-${label}.csv`,
            data.map(p => [p.colaborador.nomeCompleto, p.tipo, p.status, format(new Date(p.dataOcorrencia), "dd/MM/yyyy"), p.descricao]),
            ["Colaborador", "Tipo", "Status", "Data", "Descrição"]);
          toast.success("Histórico RAP exportado!", { id });
          break;
        }
        case "premios": {
          const data = await getRelatorioFolhaPremios(start, end);
          if (!data.length) { toast.dismiss(id); toast.info("Nenhum prêmio lançado no período."); break; }
          downloadCSV(`folha-premios-${label}.csv`,
            data.map(p => [p.colaborador.nomeCompleto, p.tipo, p.valorFinal.toString(), format(new Date(p.dataReferencia), "dd/MM/yyyy")]),
            ["Colaborador", "Tipo", "Valor", "Referência"]);
          toast.success("Folha de prêmios exportada!", { id });
          break;
        }
        case "uniformes": {
          const data = await getRelatorioControleUniformes();
          if (!data.length) { toast.dismiss(id); toast.info("Nenhum registro de uniformes."); break; }
          downloadCSV(`controle-uniformes-${label}.csv`,
            data.map(u => [u.colaborador.nomeCompleto, u.item, u.tamanho, format(new Date(u.dataRecebimento), "dd/MM/yyyy")]),
            ["Colaborador", "Item", "Tamanho", "Data"]);
          toast.success("Controle de uniformes exportado!", { id });
          break;
        }
        default:
          toast.error("Tipo de relatório não implementado.");
          toast.dismiss(id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro crítico ao gerar relatório.", { id });
    } finally {
      setLoadingReport(null);
    }
  };

  const reports = [
    { key: "experiencia", name: "Colaboradores em Experiência", group: "RH", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "documentos", name: "Documentação Pendente", group: "RH", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
    { key: "pgf", name: "PGF Consolidado (Pontuação)", group: "Operacional", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { key: "penalidades", name: "Histórico de Penalidades (RAP)", group: "Operacional", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
    { key: "premios", name: "Folha de Prêmios e Bônus", group: "Financeiro", icon: Gift, color: "text-purple-500", bg: "bg-purple-500/10" },
    { key: "uniformes", name: "Controle de Suprimentos", group: "Financeiro", icon: Shirt, color: "text-slate-500", bg: "bg-slate-500/10" },
  ];

  const filteredReports = useMemo(() => reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.group.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black">Central de BI</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Relatórios <span className="text-primary">&</span> Exportações</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Inteligência de dados em tempo real</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar relatório..." 
              className="pl-10 h-12 bg-card border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Card className="bg-card/50 backdrop-blur-xl border-primary/10 p-1.5 flex items-center gap-3 rounded-2xl">
              <Calendar className="h-4 w-4 text-primary ml-2" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-44 border-0 bg-transparent h-9 focus:ring-0 font-black text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs uppercase font-bold">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          </div>
        </div>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const isBusy = loadingReport === report.key;
          const Icon = report.icon;
          
          return (
            <Card 
              key={report.key}
              className={cn(
                "group relative overflow-hidden border-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-card/40 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 rounded-3xl",
                isBusy && "opacity-70 pointer-events-none"
              )}
              onClick={() => handleExport(report.key, report.name)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-5 w-5 text-primary" />
              </div>

              <CardHeader className="pb-4">
                <div className={cn("p-3 w-fit rounded-2xl mb-2 transition-transform group-hover:scale-110", report.bg)}>
                  <Icon className={cn("h-6 w-6", report.color)} />
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest px-2 py-0">
                    {report.group}
                  </Badge>
                  <CardTitle className="text-xl font-black tracking-tight uppercase leading-tight group-hover:text-primary transition-colors">
                    {report.name}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                <div className="flex items-center justify-between mt-4 p-3 bg-muted/20 rounded-2xl border border-primary/5 group-hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2">
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {isBusy ? "Processando..." : "Download CSV"}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>

              {/* Glow Effect */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all" />
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="bg-primary/5 border-dashed border-primary/20 p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tighter">Precisa de dados específicos?</h3>
            <p className="text-sm text-muted-foreground font-medium opacity-80">
              Todos os relatórios são gerados com base no período selecionado acima. Se precisar de uma exportação personalizada, entre em contato com o suporte técnico.
            </p>
          </div>
          <Button variant="outline" className="ml-auto rounded-xl border-primary/20 font-black uppercase text-[10px] h-10 px-6 hover:bg-primary hover:text-white transition-all shrink-0">
            Falar com Suporte
          </Button>
        </div>
      </Card>
    </div>
  );
}
