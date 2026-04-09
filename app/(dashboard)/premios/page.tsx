"use client";

import { useEffect, useState } from "react";
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Info 
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getPremios, createPremio } from "@/actions/premio-actions";
import { getColaboradores } from "@/actions/colaborador-actions";

const prizeTypes = [
  "Meta de Perda",
  "Meta de Venda",
  "Campanha Local",
  "Bônus Escalonado",
  "Prêmio Cota Individual",
  "Vale-Alimentação",
  "Abono Pontualidade",
];

export default function PremiosPage() {
  const [premios, setPremios] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [selectedColabId, setSelectedColabId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [valor, setValor] = useState("0");
  const [obs, setObs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [p, c] = await Promise.all([getPremios(), getColaboradores()]);
    setPremios(p);
    setColaboradores(c);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = premios.filter(p => 
    p.colaborador.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleSubmit() {
    if (!selectedColabId || !selectedType || !valor) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPremio({
      colaboradorId: selectedColabId,
      tipo: selectedType,
      valorOriginal: parseFloat(valor),
      valorFinal: parseFloat(valor),
      dataReferencia: new Date(),
      observacao: obs,
    });

    if (result.success) {
      toast.success("Prêmio concedido com sucesso!");
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
    setSelectedType("");
    setValor("0");
    setObs("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prêmios e Benefícios</h1>
          <p className="text-muted-foreground">
            Gestão de bônus, metas e incentivos financeiros.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Conceder Prêmio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento de Prêmio</DialogTitle>
              <DialogDescription>
                Selecione o colaborador e o tipo de incentivo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                 <Label>Colaborador Elegível</Label>
                 <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o colaborador" />
                   </SelectTrigger>
                   <SelectContent>
                      {colaboradores.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nomeCompleto} ({c.loja.nome})
                        </SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Tipo de Prêmio</Label>
                 <Select value={selectedType} onValueChange={setSelectedType}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o tipo" />
                   </SelectTrigger>
                   <SelectContent>
                      {prizeTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Valor do Bônus (R$)</Label>
                 <Input 
                   type="number" 
                   value={valor} 
                   onChange={(e) => setValor(e.target.value)} 
                 />
               </div>
               <div className="space-y-2">
                 <Label>Observação Interna</Label>
                 <Input 
                   placeholder="Ex: Meta batida com 110% de aproveitamento" 
                   value={obs}
                   onChange={(e) => setObs(e.target.value)}
                 />
               </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Processando..." : "Confirmar Prêmio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <DollarSign className="h-4 w-4" /> Total Premiado (Mês)
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">R$ 12.450,00</div>
             <p className="text-xs text-muted-foreground">+R$ 1.200 em relação ao teto</p>
           </CardContent>
         </Card>
         <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <TrendingUp className="h-4 w-4" /> Bônus de Produtividade
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-600">88%</div>
             <p className="text-xs text-muted-foreground">Colaboradores atingiram a primeira meta</p>
           </CardContent>
         </Card>
         <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <Zap className="h-4 w-4" /> Regra "Respeito"
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-amber-600">Ativa</div>
             <p className="text-xs text-muted-foreground">Bloqueio automático de excedente de prêmios</p>
           </CardContent>
         </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar lançamentos..." 
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
                <TableHead>Tipo de Prêmio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum prêmio registrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="font-medium">{p.colaborador.nomeCompleto}</span>
                         <span className="text-xs text-muted-foreground">{p.colaborador.loja.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline">{p.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                       R$ {p.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm">
                       {format(new Date(p.dataReferencia), "MMMM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                       <Badge className={p.status === "ATIVO" ? "bg-blue-500" : "bg-green-500"}>
                         {p.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                         <Info className="h-4 w-4" />
                       </Button>
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
