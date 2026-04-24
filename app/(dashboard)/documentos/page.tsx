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
  Check
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { getDocumentosPendentes, validarDocumento } from "@/actions/documento-actions";

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
  const [isValidating, setIsValidating] = useState(false);

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
    d.colaborador.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: DocumentoStatus) => {
    switch (status) {
      case "PENDENTE": return <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>;
      case "ENVIADO": return <Badge className="bg-blue-500">Enviado</Badge>;
      case "VALIDADO": return <Badge className="bg-green-500">Validado</Badge>;
      case "REJEITADO": return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  async function handleValidation(status: "VALIDADO" | "REJEITADO") {
    if (!selectedDoc) return;
    setIsValidating(true);
    const result = await validarDocumento(selectedDoc.id, status, obs);
    if (result.success) {
      toast.success(status === "VALIDADO" ? "Documento aprovado!" : "Documento rejeitado.");
      setIsDialogOpen(false);
      setObs("");
      loadData();
    } else {
      toast.error(result.error as string);
    }
    setIsValidating(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação Pendente</h1>
          <p className="text-muted-foreground">
            Valide e gerencie os documentos enviados pelos colaboradores.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Total Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-amber-600">
               {documentos.filter(d => d.status === "PENDENTE").length}
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Aguardando Validação</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-blue-600">
               {documentos.filter(d => d.status === "ENVIADO").length}
             </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 bg-gradient-to-r from-indigo-500/5 to-transparent border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Meta de Admissão
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">92%</div>
             <p className="text-xs text-muted-foreground">Documentos validados nos últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por colaborador ou documento..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Tudo em dia! Nenhum documento aguardando validação.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="font-medium">{d.colaborador.nomeCompleto}</span>
                         <span className="text-xs text-muted-foreground">{d.colaborador.loja.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-muted-foreground" />
                         {d.nome}
                       </div>
                    </TableCell>
                    <TableCell className="text-sm">
                       {format(new Date(d.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                    <TableCell className="text-right">
                       <Dialog open={isDialogOpen && selectedDoc?.id === d.id} onOpenChange={(open) => {
                         setIsDialogOpen(open);
                         if (open) setSelectedDoc(d);
                       }}>
                         <DialogTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted/50 outline-none transition-colors">
                           <Eye className="h-4 w-4" />
                         </DialogTrigger>
                         <DialogContent className="max-w-2xl">
                           <DialogHeader>
                             <DialogTitle>Validar Documento</DialogTitle>
                             <DialogDescription>
                               Analise o arquivo abaixo e tome uma decisão.
                             </DialogDescription>
                           </DialogHeader>
                           
                           <div className="grid gap-6 py-4">
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-10 w-10 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="font-bold">{d.nome}</span>
                                    <span className="text-xs text-muted-foreground">Colaborador: {d.colaborador.nomeCompleto}</span>
                                  </div>
                                </div>
                                 <a href={`/api/uploads/${d.path.split('/').pop()}`} target="_blank" rel="noopener noreferrer">
                                   <Button variant="outline" size="sm">
                                     <Download className="mr-2 h-4 w-4" /> Baixar Original
                                   </Button>
                                 </a>
                             </div>

                             <div className="h-[200px] border-2 border-dashed rounded-lg bg-muted/30 flex items-center justify-center p-4">
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                  <Clock className="h-4 w-4" /> Preview Indisponível (Use botão baixar)
                                </p>
                             </div>

                             <div className="space-y-2">
                               <Label>Observações de Validação (Opcional)</Label>
                               <Textarea 
                                 placeholder="Descreva o motivo caso rejeite o documento..." 
                                 value={obs}
                                 onChange={(e) => setObs(e.target.value)}
                               />
                             </div>
                           </div>

                           <DialogFooter className="gap-2">
                             <Button 
                              variant="destructive" 
                              onClick={() => handleValidation("REJEITADO")}
                              disabled={isValidating}
                             >
                               <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                             </Button>
                             <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleValidation("VALIDADO")}
                              disabled={isValidating}
                             >
                               <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar Documento
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
    </div>
  );
}
