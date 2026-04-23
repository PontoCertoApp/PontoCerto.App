"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar as CalendarIcon,
  UserX,
  ShieldAlert,
  FileText
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
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  getInconformidadesDoDia,
  getColaboradoresSemPontoNoDia,
  registrarInconformidade,
  getTotalAtivos
} from "@/actions/ponto-actions";

type TipoInconformidade = "FALTA_INJUSTIFICADA" | "ATRASO" | "SAIDA_ANTECIPADA" | "PONTO_NAO_REGISTRADO";

interface ColaboradorSemPonto {
  id: string;
  nomeCompleto: string;
  loja: { nome: string };
  setor: { nome: string };
}

interface RegistroPonto {
  id: string;
  tipo: TipoInconformidade;
  rapGerado: boolean;
  createdAt: string | Date;
  colaborador: { nomeCompleto: string };
}

export default function PontoPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [pendentes, setPendentes] = useState<ColaboradorSemPonto[]>([]);
  const [tratados, setTratados] = useState<RegistroPonto[]>([]);
  const [totalColaboradores, setTotalColaboradores] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColab, setSelectedColab] = useState<ColaboradorSemPonto | null>(null);

  const [tipo, setTipo] = useState<TipoInconformidade>("FALTA_INJUSTIFICADA");
  const [justificativa, setJustificativa] = useState("");
  const [gerarRap, setGerarRap] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [p, t, total] = await Promise.all([
      getColaboradoresSemPontoNoDia(date),
      getInconformidadesDoDia(date),
      getTotalAtivos()
    ]);
    setPendentes(p as unknown as ColaboradorSemPonto[]);
    setTratados(t as unknown as RegistroPonto[]);
    setTotalColaboradores(total);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [date]);

  async function handleSubmit() {
    if (!selectedColab) return;
    
    setIsSubmitting(true);
    const result = await registrarInconformidade({
      colaboradorId: selectedColab.id,
      data: date,
      tipo,
      justificativa,
      gerarRap,
    });

    if (result.success) {
      toast.success("Tratamento registrado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } else {
      toast.error(result.error as string);
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setTipo("FALTA_INJUSTIFICADA");
    setJustificativa("");
    setGerarRap(true);
    setSelectedColab(null);
  }

  const InconformidadeBadge = (tipo: TipoInconformidade) => {
    const labels: Record<TipoInconformidade, { label: string; color: string }> = {
      FALTA_INJUSTIFICADA: { label: "Falta Injustificada", color: "bg-red-500" },
      ATRASO: { label: "Atraso", color: "bg-amber-500" },
      SAIDA_ANTECIPADA: { label: "Saída Antecipada", color: "bg-orange-500" },
      PONTO_NAO_REGISTRADO: { label: "Ponto Não Registrado", color: "bg-blue-500" },
    };
    const item = labels[tipo] ?? { label: tipo, color: "bg-gray-500" };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tratamento de Ponto</h1>
          <p className="text-muted-foreground">
            Gestão diária de inconsistências e registros.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger render={<Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")} />}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => loadData()}>
            <ArrowRight className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipe Ponto OK</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
               {totalColaboradores === 0 ? "100%" : `${Math.round(((totalColaboradores - pendentes.length) / totalColaboradores) * 100)}%`}
             </div>
             <p className="text-xs text-muted-foreground">{totalColaboradores} colaboradores ativos hoje</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Inconsistências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-amber-600">{pendentes.length}</div>
             <p className="text-xs text-muted-foreground">Aguardando tratamento manual</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Tratados Hoje</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-green-600">{tratados.length}</div>
             <p className="text-xs text-muted-foreground">Registros validados pelo RH</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendentes" className="relative">
            Inconsistências
            {pendentes.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {pendentes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tratados">Histórico do Dia</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Loja/Setor</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                         <div className="flex flex-col items-center gap-2">
                           <CheckCircle2 className="h-8 w-8 text-green-500" />
                           <p>Nenhuma inconsistência pendente para esta data.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendentes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nomeCompleto}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.loja.nome} / {c.setor.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isDialogOpen && selectedColab?.id === c.id} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (open) setSelectedColab(c);
                            else resetForm();
                          }}>
                            <DialogTrigger render={<Button size="sm" variant="outline" />}>
                              Tratar <AlertCircle className="ml-2 h-4 w-4" />
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Tratamento de Inconformidade</DialogTitle>
                                <DialogDescription>
                                  Registrar motivo para o ponto não registrado do colaborador: <br />
                                  <strong className="text-foreground">{c.nomeCompleto}</strong>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Tipo de Inconformidade</Label>
                                  <Select value={tipo} onValueChange={(val) => val && setTipo(val as TipoInconformidade)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="FALTA_INJUSTIFICADA">Falta Injustificada</SelectItem>
                                      <SelectItem value="ATRASO">Atraso</SelectItem>
                                      <SelectItem value="SAIDA_ANTECIPADA">Saída Antecipada</SelectItem>
                                      <SelectItem value="PONTO_NAO_REGISTRADO">Ponto Não Registrado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Justificativa / Observação</Label>
                                  <Textarea 
                                    placeholder="Descreva o motivo..." 
                                    value={justificativa}
                                    onChange={(e) => setJustificativa(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                                  <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                      <ShieldAlert className="h-4 w-4 text-destructive" />
                                      Gerar RAP Automático?
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Cria uma advertência no perfil do colaborador.
                                    </p>
                                  </div>
                                  <Switch 
                                    checked={gerarRap}
                                    onCheckedChange={setGerarRap}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                  {isSubmitting ? "Salvando..." : "Confirmar Gravação"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratados">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Inconformidade</TableHead>
                    <TableHead>RAP Gerado</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : tratados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                        Nenhum tratamento realizado nesta data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tratados.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.colaborador.nomeCompleto}</TableCell>
                        <TableCell>{InconformidadeBadge(t.tipo)}</TableCell>
                        <TableCell>
                          {t.rapGerado ? (
                            <Badge variant="outline" className="text-destructive border-destructive">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                           {format(new Date(t.createdAt), "HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button size="sm" variant="ghost">
                             <FileText className="h-4 w-4 mr-2" /> PGF
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
