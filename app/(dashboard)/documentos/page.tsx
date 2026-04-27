"use client";

import { useEffect, useState, useMemo } from "react";
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
  ThumbsUp,
  ThumbsDown,
  History,
  CheckCircle
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { getAllDocumentos, validarDocumento } from "@/actions/documento-actions";
import { cn } from "@/lib/utils";

type DocumentoStatus = "PENDENTE" | "ENVIADO" | "VALIDADO" | "REJEITADO";

interface Documento {
  id: string;
  nome: string;
  path: string;
  status: DocumentoStatus;
  observacao?: string | null;
  createdAt: string | Date;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pendentes");

  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [obs, setObs] = useState("");
  const [isValidating, setIsValidating] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    const data = await getAllDocumentos();
    setDocumentos(data as unknown as Documento[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredBySearch = useMemo(() => {
    return documentos.filter(d => 
      (d.colaborador?.nomeCompleto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documentos, searchTerm]);

  const sections = useMemo(() => {
    return {
      pendentes: filteredBySearch.filter(d => d.status === "PENDENTE" || d.status === "ENVIADO"),
      validados: filteredBySearch.filter(d => d.status === "VALIDADO"),
      rejeitados: filteredBySearch.filter(d => d.status === "REJEITADO"),
    };
  }, [filteredBySearch]);

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
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black">Audit Center</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Gestão de <span className="text-primary">Arquivos</span></h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Histórico completo de validações e pendências</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por colaborador ou documento..." 
              className="pl-10 h-12 bg-card border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="pendentes" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-card/50 p-1 rounded-2xl border border-primary/5 h-12 backdrop-blur-sm">
            <TabsTrigger value="pendentes" className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 transition-all">
              <Clock className="mr-2 h-4 w-4" /> Pendentes ({sections.pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="validados" className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 transition-all">
              <CheckCircle className="mr-2 h-4 w-4" /> Validados ({sections.validados.length})
            </TabsTrigger>
            <TabsTrigger value="rejeitados" className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 transition-all">
              <XCircle className="mr-2 h-4 w-4" /> Rejeitados ({sections.rejeitados.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {Object.entries(sections).map(([key, list]) => (
          <TabsContent key={key} value={key} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-3xl border-primary/5 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-primary/5">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-5 text-primary">Colaborador</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Documento</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Data</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Status</TableHead>
                      {key === "rejeitados" && <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary">Motivo</TableHead>}
                      <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-right px-6 text-primary">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-primary/5">
                          <TableCell className="px-6 py-4"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                          <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                          <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                          <TableCell><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                          <TableCell className="px-6"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                        </TableRow>
                      ))
                    ) : list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={key === "rejeitados" ? 6 : 5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                            <History className="h-16 w-16" />
                            <div className="space-y-1">
                              <p className="font-black uppercase tracking-tighter text-xl">Sem registros</p>
                              <p className="text-xs uppercase font-bold tracking-widest">Nenhum documento encontrado nesta categoria.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.map((d) => (
                        <TableRow key={d.id} className="group hover:bg-primary/5 transition-colors border-primary/5">
                          <TableCell className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="font-black uppercase tracking-tighter text-sm group-hover:text-primary transition-colors">{d.colaborador?.nomeCompleto}</span>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{d.colaborador?.loja?.nome}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-3">
                               <div className={cn(
                                 "p-2 rounded-xl transition-colors",
                                 key === "pendentes" ? "bg-amber-500/10 text-amber-600" :
                                 key === "validados" ? "bg-green-500/10 text-green-600" :
                                 "bg-red-500/10 text-red-600"
                               )}>
                                  <FileText className="h-4 w-4" />
                               </div>
                               <span className="text-xs font-bold uppercase tracking-tight">{d.nome}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <span className="text-[11px] font-medium text-muted-foreground">
                               {format(new Date(d.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                             </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(d.status)}</TableCell>
                          {key === "rejeitados" && (
                            <TableCell className="max-w-[200px]">
                              <p className="text-[10px] font-medium italic opacity-70 truncate">{d.observacao || "Sem motivo registrado"}</p>
                            </TableCell>
                          )}
                          <TableCell className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {key === "pendentes" && (
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
                                 </TooltipProvider>
                               )}

                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                        onClick={() => window.open(d.path, '_blank')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                   </TooltipTrigger>
                                   <TooltipContent className="bg-primary text-white font-black uppercase text-[9px] border-0 rounded-lg">Visualizar Original</TooltipContent>
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
