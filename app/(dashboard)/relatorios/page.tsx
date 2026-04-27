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
  LayoutDashboard,
  Eye,
  Table as TableIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  getRelatorioColaboradoresExperiencia,
  getRelatorioDocumentacaoPendente,
  getRelatorioHistoricoPenalidades,
  getRelatorioFolhaPremios,
  getRelatorioControleUniformes,
  getRelatorioPGF,
} from "@/actions/relatorio-actions";

function downloadExcel(filename: string, rows: any[][], headers: string[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
  
  // Ajuste de largura das colunas
  const wscols = headers.map(() => ({ wch: 20 }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
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
  
  // Preview State
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: any[][], title: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const monthOptions = getMonthOptions();

  const getDateRange = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const ref = new Date(year, month - 1, 1);
    return { start: startOfMonth(ref), end: endOfMonth(ref) };
  };

  const fetchReportData = async (key: string) => {
    const { start, end } = getDateRange();
    
    switch (key) {
      case "experiencia": {
        const data = await getRelatorioColaboradoresExperiencia();
        return {
          headers: ["Nome", "Função", "Setor", "Loja", "Início"],
          rows: data.map(c => [c.nomeCompleto, c.funcao.nome, c.setor.nome, c.loja.nome, format(new Date(c.createdAt), "dd/MM/yyyy")]),
          raw: data
        };
      }
      case "documentos": {
        const data = await getRelatorioDocumentacaoPendente();
        return {
          headers: ["Colaborador", "Loja", "Documento", "Data"],
          rows: data.map(d => [d.colaborador.nomeCompleto, d.colaborador.loja.nome, d.nome, format(new Date(d.createdAt), "dd/MM/yyyy")]),
          raw: data
        };
      }
      case "pgf": {
        const data = await getRelatorioPGF(start, end);
        return {
          headers: ["Colaborador", "Loja", "Tipo", "Data", "Justificativa"],
          rows: data.map(r => [r.colaborador.nomeCompleto, r.colaborador.loja.nome, r.tipo || "---", format(new Date(r.data), "dd/MM/yyyy"), r.justificativa || "---"]),
          raw: data
        };
      }
      case "penalidades": {
        const data = await getRelatorioHistoricoPenalidades(start, end);
        return {
          headers: ["Colaborador", "Tipo", "Status", "Data", "Descrição"],
          rows: data.map(p => [p.colaborador.nomeCompleto, p.tipo, p.status, format(new Date(p.dataOcorrencia), "dd/MM/yyyy"), p.descricao]),
          raw: data
        };
      }
      case "premios": {
        const data = await getRelatorioFolhaPremios(start, end);
        return {
          headers: ["Colaborador", "Tipo", "Valor (R$)", "Referência"],
          rows: data.map(p => [p.colaborador.nomeCompleto, p.tipo, p.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), format(new Date(p.dataReferencia), "dd/MM/yyyy")]),
          raw: data
        };
      }
      case "uniformes": {
        const data = await getRelatorioControleUniformes();
        return {
          headers: ["Colaborador", "Item", "Tamanho", "Data"],
          rows: data.map(u => [u.colaborador.nomeCompleto, u.item, u.tamanho, format(new Date(u.dataRecebimento), "dd/MM/yyyy")]),
          raw: data
        };
      }
      default: return null;
    }
  };

  const handleAction = async (key: string, name: string, type: 'preview' | 'download') => {
    setLoadingReport(key);
    const toastId = type === 'download' ? toast.loading(`Preparando planilha Excel: ${name}...`) : null;
    
    try {
      const data = await fetchReportData(key);
      if (!data || !data.rows.length) {
        if (toastId) toast.dismiss(toastId);
        toast.info("Nenhum dado encontrado para este período.");
        return;
      }

      const label = format(getDateRange().start, "yyyy-MM");

      if (type === 'download') {
        downloadExcel(`${name.toLowerCase().replace(/ /g, '-')}-${label}`, data.rows, data.headers);
        toast.success("Excel gerado com sucesso!", { id: toastId! });
      } else {
        setPreviewData({ headers: data.headers, rows: data.rows, title: name });
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error(error);
      if (toastId) toast.error("Erro ao gerar relatório.", { id: toastId });
    } finally {
      setLoadingReport(null);
    }
  };

  const reports = [
    { key: "experiencia", name: "Colaboradores em Experiência", group: "RH", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Lista de novos talentos em período de teste." },
    { key: "documentos", name: "Documentação Pendente", group: "RH", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10", desc: "Controle de pendências de RH por loja." },
    { key: "pgf", name: "PGF Consolidado (Pontuação)", group: "Operacional", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Resumo de pontuação e presença mensal." },
    { key: "penalidades", name: "Histórico de Penalidades (RAP)", group: "Operacional", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", desc: "Relatório de advertências e suspensões." },
    { key: "premios", name: "Folha de Prêmios e Bônus", group: "Financeiro", icon: Gift, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Valores e incentivos financeiros do período." },
    { key: "uniformes", name: "Controle de Suprimentos", group: "Financeiro", icon: Shirt, color: "text-slate-500", bg: "bg-slate-500/10", desc: "Entrega e troca de uniformes e equipamentos." },
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
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Relatórios <span className="text-primary">&</span> Inteligência</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Visualize dados ou baixe planilhas Excel</p>
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
                "group relative overflow-hidden border-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98] bg-card/40 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 rounded-3xl",
                isBusy && "opacity-70 pointer-events-none"
              )}
            >
              <CardHeader className="pb-2">
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
                  <CardDescription className="text-xs">{report.desc}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pb-6 pt-4 space-y-3">
                <Button 
                  onClick={() => handleAction(report.key, report.name, 'preview')}
                  className="w-full h-11 bg-muted/40 hover:bg-muted text-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl border border-primary/5"
                  variant="ghost"
                  disabled={isBusy}
                >
                  <Eye className="mr-2 h-4 w-4" /> Visualizar Agora
                </Button>
                
                <Button 
                  onClick={() => handleAction(report.key, report.name, 'download')}
                  className="w-full h-11 bg-primary/10 hover:bg-primary hover:text-white text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl border border-primary/10 transition-all"
                  variant="outline"
                  disabled={isBusy}
                >
                   {isBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TableIcon className="mr-2 h-4 w-4" />}
                   Exportar Excel (XLSX)
                </Button>
              </CardContent>

              {/* Glow Effect */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all" />
            </Card>
          );
        })}
      </div>

      {/* Modal de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl border-primary/20">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{previewData?.title}</DialogTitle>
                <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">Prévia dos dados selecionados para {selectedMonth}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-4">
            <div className="rounded-2xl border border-primary/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {previewData?.headers.map((h, i) => (
                      <TableHead key={i} className="font-black text-[10px] uppercase tracking-widest text-primary">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData?.rows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-primary/5 transition-colors">
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-sm font-medium">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
             <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Fechar</Button>
             <Button 
               className="rounded-xl font-black uppercase text-[10px] bg-primary hover:bg-primary/90"
               onClick={() => {
                 setIsPreviewOpen(false);
                 if (previewData) handleAction(reports.find(r => r.name === previewData.title)?.key || "", previewData.title, 'download');
               }}
             >
               <Download className="mr-2 h-3 w-3" /> Baixar Planilha Completa
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Info */}
      <Card className="bg-primary/5 border-dashed border-primary/20 p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tighter">Planilhas Prontas para Uso</h3>
            <p className="text-sm text-muted-foreground font-medium opacity-80">
              O formato Excel (.xlsx) já vem com colunas organizadas e pronto para ser aberto no Excel, Google Sheets ou enviado por e-mail sem complicações.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
