"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertTriangle, 
  Search, 
  MoreVertical, 
  FileDown, 
  History,
  CheckCircle,
  XCircle,
  Clock,
  Plus
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPenalidades,
  updatePenalidadeStatus,
  createPenalidade
} from "@/actions/penalidade-actions";
import { getTotalAtivos } from "@/actions/ponto-actions";
import { getColaboradores } from "@/actions/colaborador-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PenalidadeStatus, PenalidadeTipo } from "@/lib/enums";

import { exportToExcel } from "@/lib/utils/export";

interface Penalidade {
  id: string;
  tipo: string;
  descricao: string;
  dataOcorrencia: string | Date;
  status: string;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

export default function PenalidadesPage() {
  const [penalidades, setPenalidades] = useState<Penalidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedColabId, setSelectedColabId] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<PenalidadeTipo>(PenalidadeTipo.ADVERTENCIA);
  const [motivo, setMotivo] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataToExport = filtered.map(p => ({
        'Colaborador': p.colaborador?.nomeCompleto || "N/A",
        'Loja': p.colaborador?.loja?.nome || "Geral",
        'Tipo': p.tipo,
        'Descrição': p.descricao,
        'Data': p.dataOcorrencia ? format(new Date(p.dataOcorrencia), "dd/MM/yyyy") : "--/--/----",
        'Status': p.status
      }));
      
      exportToExcel(dataToExport, "Relatorio_Penalidades");
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório.");
    } finally {
      setIsExporting(false);
    }
  };

  async function loadData() {
    setIsLoading(true);
    const [data, total, colabs] = await Promise.all([
      getPenalidades(),
      getTotalAtivos(),
      getColaboradores()
    ]);
    setPenalidades(data as unknown as Penalidade[]);
    setTotalAtivos(total);
    setColaboradores(colabs);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = penalidades.filter(p => 
    (p.colaborador?.nomeCompleto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVA": return <Badge className="bg-destructive">Ativa</Badge>;
      case "VENCIDA": return <Badge variant="secondary">Vencida</Badge>;
      case "CANCELADA": return <Badge variant="outline">Cancelada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const label = (tipo || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    switch (tipo) {
      case "INCONSISTENCIA_PONTO": return <Badge variant="outline" className="border-amber-500 text-amber-600">Ponto</Badge>;
      case "QUEDA_CONDUTA": return <Badge variant="outline" className="border-purple-500 text-purple-600">Conduta</Badge>;
      case "ADVERTENCIA": return <Badge variant="outline" className="border-destructive text-destructive">Advertência</Badge>;
      case "SUSPENSAO": return <Badge className="bg-black text-white">Suspensão</Badge>;
      default: return <Badge variant="outline">{label}</Badge>;
    }
  };

  async function handleStatusUpdate(id: string, status: PenalidadeStatus) {
    await updatePenalidadeStatus(id, status);
    toast.success("Status atualizado!");
    loadData();
  }

  async function handleSubmit() {
    if (!selectedColabId || !motivo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPenalidade({
      colaboradorId: selectedColabId,
      tipo: selectedTipo,
      motivo,
      dataOcorrencia: new Date(dataOcorrencia),
    });

    if (result.success) {
      toast.success("Penalidade aplicada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } else {
      toast.error(result.error || "Erro ao aplicar penalidade.");
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setSelectedColabId("");
    setSelectedTipo(PenalidadeTipo.ADVERTENCIA);
    setMotivo("");
    setDataOcorrencia(format(new Date(), "yyyy-MM-dd"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAPs e Penalidades</h1>
          <p className="text-muted-foreground">
            Monitoramento de conduta e histórico disciplinar.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive hover:bg-destructive/90 shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Aplicar Penalidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Aplicar Nova Penalidade (RAP)</DialogTitle>
                <DialogDescription>
                  Preencha os dados da ocorrência para o histórico disciplinar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nomeCompleto} ({c.loja?.nome || "Sem Loja"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Penalidade</Label>
                    <Select value={selectedTipo} onValueChange={(val) => setSelectedTipo(val as PenalidadeTipo)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PenalidadeTipo.ADVERTENCIA}>Advertência</SelectItem>
                        <SelectItem value={PenalidadeTipo.SUSPENSAO}>Suspensão</SelectItem>
                        <SelectItem value={PenalidadeTipo.INCONSISTENCIA_PONTO}>Inconsistência de Ponto</SelectItem>
                        <SelectItem value={PenalidadeTipo.QUEDA_CONDUTA}>Queda de Conduta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data da Ocorrência</Label>
                    <Input 
                      type="date" 
                      value={dataOcorrencia} 
                      onChange={(e) => setDataOcorrencia(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição do Motivo</Label>
                  <Textarea 
                    placeholder="Descreva detalhadamente o ocorrido..." 
                    className="h-32"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Aplicando..." : "Confirmar Aplicação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={isExporting || filtered.length === 0}
          >
            {isExporting ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ativas</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-destructive">
               {penalidades.filter(p => p.status === "ATIVA").length}
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspensões</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
               {penalidades.filter(p => p.tipo === "SUSPENSAO").length}
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas (Histórico)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-muted-foreground">
               {penalidades.filter(p => p.status === "VENCIDA").length}
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Taxa de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-green-600">
               {totalAtivos === 0 ? "100%" : `${Math.round(((totalAtivos - penalidades.filter(p => p.status === "ATIVA").length) / totalAtivos) * 100)}%`}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por colaborador ou descrição..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="max-w-[300px]">Descrição</TableHead>
                <TableHead>Ocorrência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma penalidade encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className={p.status === "ATIVA" ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{p.colaborador?.nomeCompleto || "Colaborador Excluído"}</span>
                        <span className="text-xs text-muted-foreground">{p.colaborador?.loja?.nome || "Unidade não identificada"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getTipoBadge(p.tipo)}</TableCell>
                    <TableCell className="max-w-[300px] text-sm text-muted-foreground line-clamp-1 h-auto py-4">
                      {p.descricao}
                    </TableCell>
                    <TableCell className="text-sm">
                       {format(new Date(p.dataOcorrencia), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted/50 outline-none transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                             <FileDown className="h-4 w-4" /> Imprimir RAP
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                             <History className="h-4 w-4" /> Ver Histórico
                          </DropdownMenuItem>
                          {p.status === "ATIVA" && (
                            <>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-green-600"
                                onClick={() => handleStatusUpdate(p.id, "VENCIDA")}
                              >
                                 <CheckCircle className="h-4 w-4" /> Marcar como Vencida
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-destructive"
                                onClick={() => handleStatusUpdate(p.id, "CANCELADA")}
                              >
                                 <XCircle className="h-4 w-4" /> Cancelar RAP
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="bg-muted/40 border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Atenção: Regra de Progressão Ativa
          </CardTitle>
          <CardDescription>
            O sistema monitora automaticamente o histórico de cada colaborador. 
            Acumular 2 advertências ativas sugere Suspensão. 1 suspensão ativa sugere Justa Causa.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
