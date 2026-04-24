"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft,
  Building,
  Briefcase,
  AlertTriangle,
  Eye, 
  Download,
  Loader2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { getColaboradorById } from "@/actions/colaborador-actions";
import { aprovarContratacao, iniciarDesligamento, reprovarExperiencia } from "@/actions/processo-actions";

export default function ColaboradorDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [colab, setColab] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const found = await getColaboradorById(id as string);
      setColab(found);
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
  if (!colab) return <div className="p-8">Colaborador não encontrado.</div>;

  const integrationProgress = colab.status === "ATIVO" ? 100 : 65;

  async function handleAprovar() {
    setIsProcessing(true);
    const res = await aprovarContratacao(colab.id);
    if (res.success) {
      toast.success("Colaborador aprovado com sucesso!");
      const found = await getColaboradorById(id as string);
      setColab(found);
    } else {
      toast.error(res.error as string);
    }
    setIsProcessing(false);
  }

  async function handleReprovar() {
    setIsProcessing(true);
    const res = await reprovarExperiencia(colab.id);
    if (res.success) {
      toast.success("Experiência reprovada.");
      const found = await getColaboradorById(id as string);
      setColab(found);
    } else {
      toast.error(res.error as string);
    }
    setIsProcessing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Ficha Funcional</h1>
        <Badge variant={colab.status === "ATIVO" ? "default" : "secondary"} className="ml-auto">
          {colab.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
             <div className="h-32 w-32 rounded-full border-4 border-muted overflow-hidden bg-muted flex items-center justify-center">
                {colab.fotoPerfilPath ? (
                   <img src={colab.fotoPerfilPath} alt="" className="object-cover h-full w-full" />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground opacity-20" />
                )}
             </div>
             <CardTitle className="mt-4 text-center">{colab.nomeCompleto}</CardTitle>
             <CardDescription>{colab.funcao?.nome || "Sem Função"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
               <Building className="h-4 w-4 text-muted-foreground" />
               <span>{colab.loja?.nome || "Sede"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
               <Briefcase className="h-4 w-4 text-muted-foreground" />
               <span>{colab.setor?.nome || "Geral"}</span>
            </div>
            <Separator />
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">CPF</span>
                 <span>{colab.cpf}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Admissão</span>
                 <span>{format(new Date(colab.createdAt), "dd/MM/yyyy")}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
           <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100">
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-indigo-600 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Integração de Novo Colaborador
                 </CardTitle>
                 <span className="text-sm font-bold text-indigo-600">{integrationProgress}%</span>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
                <Progress value={integrationProgress} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Treinamentos</div>
                   <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> EPIs Entregues</div>
                   <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Uniformes</div>
                   <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3 w-3" /> RH Validação Docs</div>
                </div>
                {colab.status === "EM_EXPERIENCIA" && (
                  <div className="pt-2 flex gap-2">
                    <Button className="w-full flex-1" onClick={handleAprovar} disabled={isProcessing}>
                       {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Efetivar Admissão
                    </Button>
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white">
                            Reprovar Experiência
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Reprovar Experiência?</AlertDialogTitle>
                           <AlertDialogDescription>
                             Isso marcará o colaborador como <strong>Inativo</strong>. Esta ação confirma que o colaborador não passou no período de experiência.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancelar</AlertDialogCancel>
                           <AlertDialogAction 
                             onClick={handleReprovar}
                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                           >
                             Confirmar Reprovação
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                  </div>
                )}
             </CardContent>
           </Card>

           <Tabs defaultValue="docs">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Documentação</TabsTrigger>
                <TabsTrigger value="penalidades" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Penalidades</TabsTrigger>
                <TabsTrigger value="ponto" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Ponto</TabsTrigger>
              </TabsList>
              
              <TabsContent value="docs" className="pt-4 space-y-4">
                  {colab.documentos && colab.documentos.length > 0 ? (
                    colab.documentos.map((doc: any) => (
                      <Dialog key={doc.id}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{doc.nome}</span>
                              <span className="text-[10px] text-muted-foreground">Enviado em {format(new Date(doc.createdAt), "dd/MM/yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={doc.status === "VALIDADO" ? "default" : "secondary"}>
                              {doc.status}
                            </Badge>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.path} download={doc.nome}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
                            <DialogHeader className="p-6 border-b shrink-0">
                               <div className="flex items-center justify-between">
                                  <div>
                                     <DialogTitle>{doc.nome}</DialogTitle>
                                     <DialogDescription>Visualizando documento enviado por {colab.nomeCompleto}</DialogDescription>
                                  </div>
                               </div>
                            </DialogHeader>
                            <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-4">
                               {doc.path.toLowerCase().endsWith('.pdf') ? (
                                 <iframe 
                                   src={doc.path} 
                                   className="w-full h-full rounded-md border shadow-sm"
                                   title={doc.nome}
                                 />
                               ) : (
                                 <div className="relative w-full h-full flex items-center justify-center overflow-auto">
                                   <img 
                                     src={doc.path} 
                                     alt={doc.nome}
                                     className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                                   />
                                 </div>
                               )}
                            </div>
                            <div className="p-4 border-t flex justify-end gap-2 shrink-0 bg-background/50 backdrop-blur-sm">
                               <a href={doc.path} download={doc.nome} target="_blank" rel="noopener noreferrer">
                                 <Button variant="outline">
                                   <Download className="mr-2 h-4 w-4" /> Baixar Documento
                                 </Button>
                               </a>
                            </div>
                        </DialogContent>
                      </Dialog>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                      <FileText className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="penalidades" className="pt-4">
                 <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma penalidade registrada para este colaborador.</p>
                 </div>
              </TabsContent>
              
              <TabsContent value="ponto" className="pt-4">
                 <div className="p-4 border rounded-lg flex items-center justify-between bg-muted/10">
                    <div className="flex items-center gap-3">
                       <AlertTriangle className="h-5 w-5 text-amber-500" />
                       <div className="flex flex-col">
                          <span className="text-sm font-bold">1 Falta Injustificada</span>
                          <span className="text-xs text-muted-foreground text-amber-600">Alerta: Risco de perda de bônus Vale-Alimentação</span>
                       </div>
                    </div>
                    <Button variant="outline" size="sm">Ver PGF</Button>
                 </div>
              </TabsContent>
           </Tabs>
        </div>
      </div>
      
      <div className="flex justify-end pt-6">
         <Button
          variant="outline"
          className="text-destructive border-destructive hover:bg-destructive hover:text-white"
          onClick={() => {
            if(confirm("Iniciar processo de desligamento?")) {
              iniciarDesligamento(colab.id).then(() => {
                toast.success("Processo de desligamento iniciado.");
                window.location.reload();
              });
            }
          }}
         >
           Desvincular Colaborador (Demissão)
         </Button>
      </div>
    </div>
  );
}
