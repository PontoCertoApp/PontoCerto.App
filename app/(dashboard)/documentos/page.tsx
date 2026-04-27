"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  Filter,
  Check,
  AlertCircle,
  FileCheck,
  MoreVertical,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { getDocumentosPendentes, validarDocumento } from "@/actions/documento-actions";
import { cn } from "@/lib/utils";

type DocumentoStatus = "PENDENTE" | "ENVIADO" | "VALIDADO" | "REJEITADO";

interface Documento {
  id: string;
  nome: string;
  path: string;
  status: DocumentoStatus;
  createdAt: string | Date;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [obs, setObs] = useState("");
  const [isValidating, setIsValidating] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    const data = await getDocumentosPendentes();
    setDocumentos(data as unknown as Documento[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = documentos.filter(d => 
    (d.colaborador?.nomeCompleto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: DocumentoStatus) => {
    switch (status) {
      case "PENDENTE": return <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-500/5 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">Pendente</Badge>;
      case "ENVIADO": return <Badge className="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">Enviado</Badge>;
      case "VALIDADO": return <Badge className="bg-green-500 hover:bg-green-600 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">Validado</Badge>;
      case "REJEITADO": return <Badge variant="destructive" className="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">Rejeitado</Badge>;
      default: return <Badge variant="outline" className="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">{status}</Badge>;
    }
  };

  async function handleValidation(docId: string, status: "VALIDADO" | "REJEITADO", observacao?: string) {
    setIsValidating(docId);
    const toastId = toast.loading(status === "VALIDADO" ? "Validando documento..." : "Registrando rejeição...");
    
    try {
      const result = await validarDocumento(docId, status, observacao);
      if (result.success) {
        toast.success(status === "VALIDADO" ? "Documento validado com sucesso!" : "Documento rejeitado.", { id: toastId });
        setIsDialogOpen(false);
        setObs("");
        loadData();
      } else {
        toast.error(result.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Erro ao processar validação", { id: toastId });
    } finally {
      setIsValidating(null);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black">Módulo de Compliance</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Validação de <span className="text-primary">Documentos</span></h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Gerencie a conformidade jurídica dos colaboradores</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar colaborador ou tipo de documento..." 
              className="pl-10 h-12 bg-card border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-amber-500/5 border-amber-500/20 rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/70 flex items-center gap-2">
              <Clock className="h-3 w-3" /> Total Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-black text-amber-600 tracking-tighter">
               {documentos.filter(d => d.status === "PENDENTE" || d.status === "ENVIADO").length}
             </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
            <AlertCircle className="h-24 w-24 text-amber-600" />
          </div>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20 rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70 flex items-center gap-2">
              <Download className="h-3 w-3" /> Novos Envios
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-black text-blue-600 tracking-tighter">
               {documentos.filter(d => d.status === "ENVIADO").length}
             </div>
          </CardContent>
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
            <FileText className="h-24 w-24 text-blue-600" />
          </div>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20 rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/70 flex items-center gap-2">
              <Check className="h-3 w-3" /> Meta de Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-black text-green-600 tracking-tighter">92%</div>
             <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">SLA de Aprovação: 24h</p>
          </CardContent>
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
            <CheckCircle2 className="h-24 w-24 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-3xl border-primary/5 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-primary/5">
                <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-5 text-primary">Colaborador</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Documento</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Data de Envio</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Status</TableHead>
                <TableHead className="w-[200px] font-black text-[10px] uppercase tracking-widest text-right px-6 text-primary">Ações Rápidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    <TableCell className="px-6 py-4"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <FileCheck className="h-16 w-16" />
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tighter text-xl">Tudo em conformidade!</p>
                        <p className="text-xs uppercase font-bold tracking-widest">Nenhum documento aguardando validação.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id} className="group hover:bg-primary/5 transition-colors border-primary/5">
                    <TableCell className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="font-black uppercase tracking-tighter text-sm group-hover:text-primary transition-colors">{d.colaborador?.nomeCompleto}</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{d.colaborador?.loja?.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <FileText className="h-4 w-4" />
                         </div>
                         <span className="text-xs font-bold uppercase tracking-tight">{d.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-[11px] font-medium text-muted-foreground">
                         {format(new Date(d.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                       </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                    <TableCell className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl hover:bg-green-500/10 hover:text-green-600 transition-all active:scale-90"
                                  onClick={() => handleValidation(d.id, "VALIDADO")}
                                  disabled={isValidating === d.id}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                             </TooltipTrigger>
                             <TooltipContent className="bg-green-600 text-white font-black uppercase text-[9px] border-0 rounded-lg">Aprovar Agora</TooltipContent>
                           </Tooltip>

                           <Tooltip>
                             <TooltipTrigger asChild>
                                <Dialog open={isDialogOpen && selectedDoc?.id === d.id} onOpenChange={(open) => {
                                  setIsDialogOpen(open);
                                  if (open) setSelectedDoc(d);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-600 transition-all active:scale-90"
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl rounded-3xl border-primary/20 p-8">
                                    <DialogHeader>
                                      <div className="p-3 w-fit bg-red-500/10 rounded-2xl mb-2">
                                        <XCircle className="h-8 w-8 text-red-500" />
                                      </div>
                                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Rejeitar Documento</DialogTitle>
                                      <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                                        Informe o motivo da rejeição para que o colaborador possa corrigir.
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6 py-4">
                                      <div className="p-4 bg-muted/40 rounded-2xl border border-primary/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <FileText className="h-8 w-8 text-primary" />
                                          <div className="flex flex-col">
                                            <span className="font-black text-sm uppercase tracking-tighter">{selectedDoc?.nome}</span>
                                            <span className="text-[10px] font-bold uppercase opacity-60">{selectedDoc?.colaborador.nomeCompleto}</span>
                                          </div>
                                        </div>
                                        <a href={selectedDoc?.path} target="_blank" rel="noopener noreferrer">
                                          <Button variant="outline" size="sm" className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest">
                                            Ver Original
                                          </Button>
                                        </a>
                                      </div>

                                      <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Motivo da Rejeição</Label>
                                        <Textarea 
                                          placeholder="Ex: Documento com baixa qualidade, faltando assinatura, data expirada..." 
                                          className="rounded-2xl min-h-[120px] bg-muted/20 border-primary/10 focus-visible:ring-primary/20 p-4 font-medium"
                                          value={obs}
                                          onChange={(e) => setObs(e.target.value)}
                                        />
                                      </div>
                                    </div>

                                    <DialogFooter className="gap-2 sm:justify-between pt-4">
                                      <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cancelar</Button>
                                      <Button 
                                       variant="destructive" 
                                       onClick={() => handleValidation(selectedDoc!.id, "REJEITADO", obs)}
                                       className="rounded-xl font-black uppercase text-[10px] px-8"
                                       disabled={!obs || isValidating === selectedDoc?.id}
                                      >
                                        Confirmar Rejeição
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                             </TooltipTrigger>
                             <TooltipContent className="bg-red-600 text-white font-black uppercase text-[9px] border-0 rounded-lg">Rejeitar com Motivo</TooltipContent>
                           </Tooltip>

                           <Tooltip>
                             <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                  onClick={() => {
                                    setSelectedDoc(d);
                                    // Aqui poderíamos abrir apenas o preview sem as ações de rejeição
                                    window.open(d.path, '_blank');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                             </TooltipTrigger>
                             <TooltipContent className="bg-primary text-white font-black uppercase text-[9px] border-0 rounded-lg">Visualizar</TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-primary/5 rounded-[2.5rem] border border-dashed border-primary/20">
        <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-primary/30">
          <FileCheck className="h-8 w-8 text-white" />
        </div>
        <div className="text-center md:text-left space-y-1">
          <h3 className="font-black uppercase tracking-tighter text-lg">Processamento em Tempo Real</h3>
          <p className="text-sm text-muted-foreground font-medium opacity-80 leading-relaxed max-w-2xl">
            Ao validar ou rejeitar um documento, o sistema atualiza o status do colaborador instantaneamente e envia uma notificação automática para o app do funcionário informando o resultado da análise.
          </p>
        </div>
      </div>
    </div>
  );
}
