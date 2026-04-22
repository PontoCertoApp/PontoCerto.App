"use client";

import { useEffect, useState } from "react";
import { 
  Shirt, 
  Plus, 
  Search, 
  RotateCcw, 
  AlertCircle, 
  History,
  Store 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Skeleton } from "@/components/ui/skeleton";

import { 
  getHistoricoUniformes, 
  registrarEntregaUniforme, 
  getEstoqueUniforme 
} from "@/actions/uniforme-actions";
import { getColaboradores } from "@/actions/colaborador-actions";

interface ControleUniforme {
  id: string;
  item: string;
  tamanho: string;
  dataRecebimento: string | Date;
  dataTrocaPrevista: string | Date | null;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
}

interface EstoqueUniforme {
  id: string;
  item: string;
  tamanho: string;
  quantidade: number;
  loja: { nome: string };
}

interface ColaboradorOption {
  id: string;
  nomeCompleto: string;
}

export default function UniformesPage() {
  const [historico, setHistorico] = useState<ControleUniforme[]>([]);
  const [estoque, setEstoque] = useState<EstoqueUniforme[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [selectedColabId, setSelectedColabId] = useState("");
  const [item, setItem] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [h, e, c] = await Promise.all([
      getHistoricoUniformes(),
      getEstoqueUniforme(),
      getColaboradores(),
    ]);
    setHistorico(h);
    setEstoque(e);
    setColaboradores(c);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit() {
    if (!selectedColabId || !item || !tamanho) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    const result = await registrarEntregaUniforme({
      colaboradorId: selectedColabId,
      item,
      tamanho,
    });

    if (result.success) {
      toast.success("Entrega registrada!");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } else {
      toast.error(result.error as string);
    }
    setIsSubmitting(false);
  }

  function resetForm() {
    setSelectedColabId("");
    setItem("");
    setTamanho("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Uniformes</h1>
          <p className="text-muted-foreground">
            Gestão de estoque e histórico de entregas.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Entregar Uniforme
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Entrega</DialogTitle>
              <DialogDescription>
                Selecione o item e o colaborador.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                 <Label>Colaborador</Label>
                 <Select value={selectedColabId} onValueChange={(val) => setSelectedColabId(val ?? "")}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o colaborador" />
                   </SelectTrigger>
                   <SelectContent>
                      {colaboradores.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Item</Label>
                   <Select value={item} onValueChange={(val) => setItem(val ?? "")}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Camiseta Polo">Camiseta Polo</SelectItem>
                        <SelectItem value="Calça Brim">Calça Brim</SelectItem>
                        <SelectItem value="Avental">Avental</SelectItem>
                        <SelectItem value="Boné">Boné</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tamanho</Label>
                   <Select value={tamanho} onValueChange={(val) => setTamanho(val ?? "")}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                        <SelectItem value="XG">XG</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Confirmar Entrega"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="historico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Histórico de Entregas
          </TabsTrigger>
          <TabsTrigger value="estoque" className="flex items-center gap-2">
            <Store className="h-4 w-4" /> Estoque por Unidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
           <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Item / Tamanho</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Troca Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma entrega registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((h) => {
                      const daysUntilExchange = h.dataTrocaPrevista 
                        ? differenceInDays(new Date(h.dataTrocaPrevista), new Date()) 
                        : null;
                      
                      return (
                        <TableRow key={h.id}>
                          <TableCell>
                             <div className="flex flex-col text-sm">
                               <span className="font-medium">{h.colaborador.nomeCompleto}</span>
                               <span className="text-xs text-muted-foreground">{h.colaborador.loja.nome}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <Shirt className="h-4 w-4 text-muted-foreground" />
                               {h.item} ({h.tamanho})
                             </div>
                          </TableCell>
                          <TableCell className="text-sm">
                             {format(new Date(h.dataRecebimento), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-sm">
                             {h.dataTrocaPrevista ? format(new Date(h.dataTrocaPrevista), "dd/MM/yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                             {daysUntilExchange !== null && daysUntilExchange < 15 ? (
                               <Badge className="bg-amber-500 flex items-center gap-1">
                                 <AlertCircle className="h-3 w-3" /> Troca Próxima
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="text-green-600 border-green-200">Em dia</Badge>
                             )}
                          </TableCell>
                          <TableCell>
                             <Button variant="ghost" size="icon" onClick={() => toast.info("Funcionalidade de devolução em breve")}>
                               <RotateCcw className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : estoque.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  Estoque não alimentado. Favor cadastrar itens.
                </div>
              ) : (
                estoque.map((e) => (
                  <Card key={e.id}>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-bold">{e.loja.nome}</CardTitle>
                       <CardDescription>{e.item}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                       <Badge variant="secondary" className="text-lg px-3 py-1">Tam: {e.tamanho}</Badge>
                       <div className="text-3xl font-bold">{e.quantidade}</div>
                    </CardContent>
                  </Card>
                ))
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
