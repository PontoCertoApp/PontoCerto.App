"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  MapPin, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserMinus,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { getColaboradoresPaged } from "@/actions/colaborador-actions";
import { useDebounce } from "@/hooks/use-debounce";

type ColaboradorStatus = "ATIVO" | "EM_EXPERIENCIA" | "DESLIGADO";

interface ColaboradorItem {
  id: string;
  nomeCompleto: string;
  cpf: string;
  status: ColaboradorStatus;
  funcao: { nome: string };
  setor: { nome: string };
  loja: { nome: string };
}

interface PagedResult {
  items: ColaboradorItem[];
  metadata: { total: number; totalPages: number; page: number };
}

export default function ColaboradoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<PagedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Params from URL or defaults
  const query = searchParams.get("q") || "";
  const status = searchParams.get("status") || undefined;
  const page = Number(searchParams.get("page")) || 1;

  const [inputSearch, setInputSearch] = useState(query);
  const debouncedSearch = useDebounce(inputSearch, 500);

  async function loadData() {
    setIsLoading(true);
    const result = await getColaboradoresPaged({
      query: debouncedSearch,
      status: status as ColaboradorStatus | undefined,
      page,
      limit: 10
    });
    setData(result as unknown as PagedResult);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [debouncedSearch, status, page]);

  // Update URL on search change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    params.set("page", "1"); // Reset to page 1 on search
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch]);

  const StatusBadge = (status: ColaboradorStatus) => {
    switch (status) {
      case "ATIVO":
        return <Badge className="bg-green-500 hover:bg-green-600"><UserCheck className="mr-1 h-3 w-3" /> Ativo</Badge>;
      case "EM_EXPERIENCIA":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Experiência</Badge>;
      case "DESLIGADO":
        return <Badge variant="destructive"><UserMinus className="mr-1 h-3 w-3" /> Desligado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerenciamento centralizado de colaboradores e contratos.
          </p>
        </div>
        <Button render={<Link href="/colaboradores/novo" />} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou CPF..." 
                className="pl-10 h-11 border-muted hover:border-primary/50 transition-colors" 
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={status || "ALL"} 
                onValueChange={(val) => {
                   const params = new URLSearchParams(searchParams);
                   if (val === "ALL" || !val) params.delete("status");
                   else params.set("status", val);
                   params.set("page", "1");
                   router.push(`?${params.toString()}`);
                }}
              >
                <SelectTrigger className="w-[180px] h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="ATIVO">Ativos</SelectItem>
                  <SelectItem value="EM_EXPERIENCIA">Em Experiência</SelectItem>
                  <SelectItem value="DESLIGADO">Desligados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px] font-bold">Colaborador</TableHead>
              <TableHead className="font-bold">Cargo / Setor</TableHead>
              <TableHead className="font-bold">Unidade</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                     <AlertCircle className="h-10 w-10 text-muted-foreground opacity-20" />
                     <p className="text-muted-foreground font-medium">Nenhum colaborador encontrado.</p>
                     <Button variant="link" onClick={() => { setInputSearch(""); router.push("/colaboradores") }}>Limpar filtros</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.items?.map((c) => (
                <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        {c.nomeCompleto.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/colaboradores/${c.id}`} className="font-bold hover:text-primary transition-colors">
                          {c.nomeCompleto}
                        </Link>
                        <span className="text-xs text-muted-foreground">CPF: {c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-sm font-medium flex items-center gap-1">
                         <Briefcase className="h-3 w-3 text-muted-foreground" /> {c.funcao.nome}
                       </span>
                       <span className="text-xs text-muted-foreground italic pl-4">{c.setor.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {c.loja.nome}
                    </span>
                  </TableCell>
                  <TableCell>
                    {StatusBadge(c.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href={`/colaboradores/${c.id}`} />}>
                          Ver Ficha Funcional
                        </DropdownMenuItem>
                        <DropdownMenuItem>Editar Dados</DropdownMenuItem>
                        <DropdownMenuItem className="text-blue-600">Documentação</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Lançar Penalidade</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!isLoading && data && data.metadata.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
           <p className="text-sm text-muted-foreground">
             Mostrando <span className="font-bold text-foreground">{(page-1)*10 + 1}</span> a <span className="font-bold text-foreground">{Math.min(page*10, data.metadata.total)}</span> de <span className="font-bold text-foreground">{data.metadata.total}</span> resultados
           </p>
           <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <div className="flex items-center gap-1">
                 {Array.from({ length: data.metadata.totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                 ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.metadata.totalPages}
              >
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
