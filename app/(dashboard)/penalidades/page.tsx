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
  Clock
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
  updatePenalidadeStatus 
} from "@/actions/penalidade-actions";

export default function PenalidadesPage() {
  const [penalidades, setPenalidades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setIsLoading(true);
    const data = await getPenalidades();
    setPenalidades(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = penalidades.filter(p => 
    p.colaborador.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
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
    switch (tipo) {
      case "INCONSISTENCIA_PONTO": return <Badge variant="outline" className="border-amber-500 text-amber-600">Ponto</Badge>;
      case "QUEDA_CONDUTA": return <Badge variant="outline" className="border-purple-500 text-purple-600">Conduta</Badge>;
      case "ADVERTENCIA": return <Badge variant="outline" className="border-destructive text-destructive">Advertência</Badge>;
      case "SUSPENSAO": return <Badge className="bg-black text-white">Suspensão</Badge>;
      default: return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  async function handleStatusUpdate(id: string, status: any) {
    await updatePenalidadeStatus(id, status);
    toast.success("Status atualizado!");
    loadData();
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
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
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
             <div className="text-2xl font-bold text-green-600">97.4%</div>
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
                        <span>{p.colaborador.nomeCompleto}</span>
                        <span className="text-xs text-muted-foreground">{p.colaborador.loja.nome}</span>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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
