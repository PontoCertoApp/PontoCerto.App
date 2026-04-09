"use client";

import { 
  FileText, 
  Download, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Gift, 
  Shirt, 
  FileCheck, 
  Filter
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

const reportGroups = [
  {
    title: "Gestão de Equipe",
    reports: [
      { name: "Vida Funcional Completa", description: "Histórico completo de um colaborador específico.", icon: Users },
      { name: "Colaboradores em Experiência", description: "Lista de quem está no período de 3 dias de teste.", icon: FileCheck },
      { name: "Documentação Pendente", description: "Relatório de conformidade de documentos.", icon: FileText },
    ]
  },
  {
    title: "Operacional & Ponto",
    reports: [
      { name: "PGF Consolidado (Loja)", description: "Relatório de ponto mensal para assinatura do gestor.", icon: BarChart3 },
      { name: "Histórico de Penalidades (RAP)", description: "Consolidado de advertências e suspensões.", icon: AlertTriangle },
    ]
  },
  {
    title: "Benefícios & Suprimentos",
    reports: [
      { name: "Folha de Prêmios e Bônus", description: "Resumo de pagamentos extras por competência.", icon: Gift },
      { name: "Controle de Uniformes", description: "Itens entregues vs devolvidos por unidade.", icon: Shirt },
    ]
  }
];

export default function RelatoriosPage() {
  const handleExport = (name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Gerando PDF: ${name}...`,
        success: `${name} exportado com sucesso!`,
        error: "Erro ao gerar PDF",
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios e Exportações</h1>
        <p className="text-muted-foreground">
          Gere documentos oficiais e relatórios gerenciais em PDF.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-8">
         <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros Globais</Button>
      </div>

      <div className="grid gap-8">
         {reportGroups.map((group) => (
           <div key={group.title} className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">{group.title}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {group.reports.map((report) => (
                   <Card key={report.name} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => handleExport(report.name)}>
                     <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                             <report.icon size={20} />
                          </div>
                          <Download size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <CardTitle className="text-base mt-4">{report.name}</CardTitle>
                       <CardDescription className="text-xs line-clamp-2">
                         {report.description}
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="pt-4 flex justify-end">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">Gerar Relatório</Button>
                     </CardContent>
                   </Card>
                 ))}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
