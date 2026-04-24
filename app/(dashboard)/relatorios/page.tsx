"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  BarChart3,
  Users,
  AlertTriangle,
  Gift,
  Shirt,
  FileCheck,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getMonthOptions() {
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    options.push({
      label: format(d, "MMMM yyyy", { locale: ptBR }),
      value: format(d, "yyyy-MM"),
    });
  }
  return options;
}

export default function RelatoriosPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const monthOptions = getMonthOptions();

  function getDateRange() {
    const [year, month] = selectedMonth.split("-").map(Number);
    const ref = new Date(year, month - 1, 1);
    return { start: startOfMonth(ref), end: endOfMonth(ref) };
  }

  async function handleExport(reportKey: string, reportName: string) {
    setLoadingReport(reportKey);
    try {
      const { start, end } = getDateRange();
      const monthLabel = format(start, "yyyy-MM");

      switch (reportKey) {
        case "experiencia": {
          const data = await getRelatorioColaboradoresExperiencia();
          if (!data.length) { toast.info("Nenhum colaborador em experiência."); break; }
          downloadCSV(`colaboradores-experiencia-${monthLabel}.csv`, data.map((c) => [
            c.nomeCompleto, c.cpf, c.telefonePrincipal, c.funcao.nome, c.setor.nome, c.loja.nome,
            format(new Date(c.createdAt), "dd/MM/yyyy"),
          ]), ["Nome", "CPF", "Telefone", "Função", "Setor", "Loja", "Admissão"]);
          toast.success(`${data.length} registros exportados.`);
          break;
        }
        case "documentos": {
          const data = await getRelatorioDocumentacaoPendente();
          if (!data.length) { toast.info("Nenhuma documentação pendente."); break; }
          downloadCSV(`documentacao-pendente-${monthLabel}.csv`, data.map((d) => [
            d.colaborador.nomeCompleto, d.colaborador.loja.nome, d.nome,
            format(new Date(d.createdAt), "dd/MM/yyyy"),
          ]), ["Colaborador", "Loja", "Documento", "Data"]);
          toast.success(`${data.length} documentos pendentes exportados.`);
          break;
        }
        case "penalidades": {
          const data = await getRelatorioHistoricoPenalidades(start, end);
          if (!data.length) { toast.info("Nenhuma penalidade no período."); break; }
          downloadCSV(`penalidades-${monthLabel}.csv`, data.map((p) => [
            p.colaborador.nomeCompleto, p.colaborador.loja.nome, p.tipo, p.descricao,
            format(new Date(p.dataOcorrencia), "dd/MM/yyyy"), p.status,
          ]), ["Colaborador", "Loja", "Tipo", "Descrição", "Ocorrência", "Status"]);
          toast.success(`${data.length} penalidades exportadas.`);
          break;
        }
        case "premios": {
          const data = await getRelatorioFolhaPremios(start, end);
          if (!data.length) { toast.info("Nenhum prêmio no período."); break; }
          downloadCSV(`premios-${monthLabel}.csv`, data.map((p) => [
            p.colaborador.nomeCompleto, p.colaborador.loja.nome, p.tipo,
            String(p.valorFinal.toFixed(2)), format(new Date(p.dataReferencia), "dd/MM/yyyy"), p.status,
          ]), ["Colaborador", "Loja", "Tipo", "Valor (R$)", "Referência", "Status"]);
          toast.success(`${data.length} prêmios exportados.`);
          break;
        }
        case "uniformes": {
          const data = await getRelatorioControleUniformes();
          if (!data.length) { toast.info("Nenhum registro de uniforme."); break; }
          downloadCSV(`uniformes-${monthLabel}.csv`, data.map((u) => [
            u.colaborador.nomeCompleto, u.colaborador.loja.nome, u.item, u.tamanho,
            format(new Date(u.dataRecebimento), "dd/MM/yyyy"),
            u.dataTrocaPrevista ? format(new Date(u.dataTrocaPrevista), "dd/MM/yyyy") : "",
            u.devolvido ? "Sim" : "Não",
          ]), ["Colaborador", "Loja", "Item", "Tamanho", "Recebimento", "Troca Prevista", "Devolvido"]);
          toast.success(`${data.length} registros exportados.`);
          break;
        }
        case "pgf": {
          const data = await getRelatorioPGF(start, end);
          if (!data.length) { toast.info("Nenhum registro de ponto no período."); break; }
          downloadCSV(`pgf-${monthLabel}.csv`, data.map((r) => [
            r.colaborador.nomeCompleto, r.colaborador.loja.nome, r.tipo,
            format(new Date(r.data), "dd/MM/yyyy"), r.justificativa ?? "", r.status,
          ]), ["Colaborador", "Loja", "Tipo", "Data", "Justificativa", "Status"]);
          toast.success(`${data.length} registros de ponto exportados.`);
          break;
        }
        default:
          toast.info("Relatório em desenvolvimento.");
      }
    } catch {
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setLoadingReport(null);
    }
  }

  const reportGroups = [
    {
      title: "Gestão de Equipe",
      reports: [
        {
          key: "experiencia",
          name: "Colaboradores em Experiência",
          description: "Lista de colaboradores no período de experiência, com admissão, função e setor.",
          icon: FileCheck,
        },
        {
          key: "documentos",
          name: "Documentação Pendente",
          description: "Documentos com status PENDENTE por colaborador e loja.",
          icon: FileText,
        },
        {
          key: "vida",
          name: "Vida Funcional Completa",
          description: "Histórico completo de um colaborador (disponível na página do colaborador).",
          icon: Users,
          disabled: true,
        },
      ],
    },
    {
      title: "Operacional & Ponto",
      reports: [
        {
          key: "pgf",
          name: "PGF Consolidado (Loja)",
          description: "Relatório de ponto mensal consolidado para o período selecionado.",
          icon: BarChart3,
        },
        {
          key: "penalidades",
          name: "Histórico de Penalidades (RAP)",
          description: "Todas as advertências e suspensões do período selecionado.",
          icon: AlertTriangle,
        },
      ],
    },
    {
      title: "Benefícios & Suprimentos",
      reports: [
        {
          key: "premios",
          name: "Folha de Prêmios e Bônus",
          description: "Todos os prêmios lançados no período com valores e status.",
          icon: Gift,
        },
        {
          key: "uniformes",
          name: "Controle de Uniformes",
          description: "Itens entregues, tamanhos e datas de troca previstas.",
          icon: Shirt,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios e Exportações</h1>
        <p className="text-muted-foreground">
          Gere relatórios em CSV com dados reais do banco de dados.
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
        <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período de Referência
          </Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground ml-2">
          Relatórios marcados com <Download className="inline h-3 w-3" /> exportam como arquivo CSV.
        </p>
      </div>

      <div className="grid gap-8">
        {reportGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">{group.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.reports.map((report) => {
                const isLoading = loadingReport === report.key;
                return (
                  <Card
                    key={report.key}
                    className={`transition-colors group ${report.disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <report.icon size={20} />
                        </div>
                        {!report.disabled && (
                          <Download size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <CardTitle className="text-base mt-4">{report.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex justify-end">
                      {report.disabled ? (
                        <span className="text-xs text-muted-foreground">Ver na página do colaborador</span>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          disabled={isLoading}
                          onClick={() => handleExport(report.key, report.name)}
                        >
                          {isLoading ? (
                            <><Loader2 className="h-3 w-3 animate-spin mr-1" />Gerando...</>
                          ) : (
                            "Exportar CSV"
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
