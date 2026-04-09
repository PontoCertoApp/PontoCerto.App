"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, User, MoreVertical, Eye, FileEdit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColaboradores } from "@/actions/colaborador-actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadColaboradores() {
    setIsLoading(true);
    const data = await getColaboradores();
    setColaboradores(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadColaboradores();
  }, []);

  const filtered = colaboradores.filter(c => 
    c.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO": return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case "EM_EXPERIENCIA": return <Badge className="bg-blue-500 hover:bg-blue-600">Experiência</Badge>;
      case "DESLIGADO": return <Badge variant="destructive">Desligado</Badge>;
      case "INATIVO": return <Badge variant="secondary">Inativo</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">
            Listagem e gestão de toda a equipe.
          </p>
        </div>
        <Button asChild>
          <Link href="/colaboradores/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou CPF..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Cargo/Setor</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                       <User className="h-12 w-12 text-muted-foreground opacity-20" />
                       <p className="font-medium text-muted-foreground">Nenhum colaborador encontrado.</p>
                       <Button variant="link" asChild>
                         <Link href="/colaboradores/novo">Cadastrar agora</Link>
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={c.fotoPerfilPath} />
                          <AvatarFallback>{c.nomeCompleto.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.nomeCompleto}</span>
                          <span className="text-xs text-muted-foreground">{c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{c.loja.nome}</TableCell>
                    <TableCell>
                       <div className="flex flex-col text-sm">
                         <span>{c.funcao.nome}</span>
                         <span className="text-xs text-muted-foreground">{c.setor.nome}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       {c.contratoAssinadoPath ? (
                         <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Assinado</Badge>
                       ) : (
                         <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pendente</Badge>
                       )}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/colaboradores/${c.id}`} className="cursor-pointer flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Visualizar Completo
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/colaboradores/${c.id}/editar`} className="cursor-pointer flex items-center gap-2">
                              <FileEdit className="h-4 w-4" />
                              Editar Dados
                            </Link>
                          </DropdownMenuItem>
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
    </div>
  );
}
