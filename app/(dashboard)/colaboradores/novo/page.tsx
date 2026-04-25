"use client";

import { useState, useEffect } from "react";
// Version: 1.0.5 - Fixes real document saving and error visibility
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Upload, 
  User, 
  FileText, 
  Building2, 
  Image as LucideImage,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { getLojas } from "@/actions/loja-actions";
import { getSetores } from "@/actions/setor-actions";
import { getFuncoes } from "@/actions/funcao-actions";
import { createColaborador } from "@/actions/colaborador-actions";

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Empresa", icon: Building2 },
  { id: 3, title: "Documentação & Finalização", icon: FileText },
];

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "Mínimo 3 caracteres"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  rg: z.string().min(5, "RG inválido"),
  dataNascimento: z.string().min(1, "Obrigatório"),
  telefonePrincipal: z.string().min(10, "Mínimo 10 dígitos"),
  telefoneSecundario: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  
  lojaId: z.string().optional(),
  setorNome: z.string().min(1, "Obrigatório"),
  funcaoNome: z.string().min(1, "Obrigatório"),
  contaBancoBrasil: z.string().min(1, "Obrigatório"),
  possuiFilhosMenores14: z.boolean().default(false),
  
  // File paths (simulated as strings after upload)
  enderecoComprovantePath: z.string().optional(),
  pisFotoPath: z.string().optional(),
  historicoEscolarPath: z.string().optional(),
  ctpsDigitalPath: z.string().optional(),
  certidaoFilhosPath: z.string().optional(),
  fotoPerfilPath: z.string().optional(),
  contratoAssinadoPath: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NovoColaboradorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lojas, setLojas] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [funcoes, setFuncoes] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      nomeCompleto: "",
      cpf: "",
      rg: "",
      dataNascimento: "",
      telefonePrincipal: "",
      telefoneSecundario: "",
      email: "",
      lojaId: "",
      setorNome: "",
      funcaoNome: "",
      contaBancoBrasil: "",
      possuiFilhosMenores14: false,
    },
  });

  useEffect(() => {
    async function loadData() {
      // No longer need to load setores and funcoes for select
    }
    loadData();
  }, []);

  const progress = (currentStep / steps.length) * 100;

  async function nextStep() {
    // Validate current step fields before proceeding
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["nomeCompleto", "cpf", "rg", "dataNascimento", "telefonePrincipal"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["setorNome", "funcaoNome", "contaBancoBrasil"];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function prevStep() {
    setCurrentStep((prev) => prev - 1);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const result = await createColaborador(values);
    if (result.success) {
      toast.success("Colaborador cadastrado com sucesso!");
      router.push("/colaboradores");
    } else {
      console.error("[SUBMIT_ERROR]:", result.error);
      toast.error(result.error as string || "Erro ao salvar cadastro.");
    }
    setIsSubmitting(false);
  }

  // Helper for file upload simulation
  const handleFileUpload = async (fieldName: keyof FormValues) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      const promise = fetch("/api/upload", {
        method: "POST",
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (data.success) {
          form.setValue(fieldName, data.path);
          return data;
        }
        throw new Error(data.error || "Erro no upload");
      });

      toast.promise(promise, {
        loading: "Enviando arquivo...",
        success: "Arquivo enviado com sucesso!",
        error: (err) => `Falha: ${err.message}`,
      });
    };

    input.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
        <p className="text-muted-foreground">
          Siga as etapas para realizar o cadastro completo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do colaborador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF (Somente números)</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901" maxLength={11} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do RG" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefonePrincipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <FormField
                      control={form.control}
                      name="setorNome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Operacional, Administrativo..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="funcaoNome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função (Cargo)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Atendente, Gerente..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contaBancoBrasil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Banco do Brasil</FormLabel>
                          <FormControl>
                            <Input placeholder="Agência e Conta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="possuiFilhosMenores14"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Possui filhos menores de 14 anos?</FormLabel>
                            <FormDescription>
                              Se sim, será necessário o upload da certidão de nascimento.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4 md:col-span-2">
                       <h3 className="text-lg font-medium">Upload de Documentos, Foto e Contrato</h3>
                       <p className="text-sm text-muted-foreground">Formatos aceitos: PDF e Imagens (PNG/JPG)</p>
                    </div>
                    
                    {[
                      { label: "Comprovante de Endereço", name: "enderecoComprovantePath" },
                      { label: "Foto do PIS", name: "pisFotoPath" },
                      { label: "Histórico Escolar / Certificado", name: "historicoEscolarPath" },
                      { label: "CTPS Digital", name: "ctpsDigitalPath" },
                      { label: "Foto de Perfil", name: "fotoPerfilPath" },
                      { label: "Contrato Assinado", name: "contratoAssinadoPath" },
                    ].map((doc) => {
                      const isUploaded = !!form.watch(doc.name as any);
                      return (
                        <div key={doc.name} className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50 transition-all duration-300">
                          <span className="text-sm font-medium">{doc.label}</span>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant={isUploaded ? "default" : "outline"}
                              className={`w-full transition-all duration-500 ${isUploaded ? "bg-green-600 hover:bg-green-700 border-green-600" : "bg-background"}`}
                              onClick={() => handleFileUpload(doc.name as any)}
                            >
                              {isUploaded ? (
                                <Check className="mr-2 h-4 w-4 animate-in zoom-in" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              {isUploaded ? "Arquivo Enviado" : "Selecionar Arquivo"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {form.watch("possuiFilhosMenores14") && (
                       <div className="flex flex-col gap-2 p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/10 md:col-span-2">
                        <span className="text-sm font-medium">Certidão de Nascimento (Filhos)</span>
                        <Button 
                          type="button" 
                          variant={form.watch("certidaoFilhosPath") ? "default" : "outline"}
                          className={`w-full transition-all ${form.watch("certidaoFilhosPath") ? "bg-green-600 hover:bg-green-700" : "bg-background"}`}
                          onClick={() => handleFileUpload("certidaoFilhosPath")}
                        >
                          {form.watch("certidaoFilhosPath") ? <Check className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                          {form.watch("certidaoFilhosPath") ? "Certidão Enviada" : "Upload Certidão"}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                )}
                
                {currentStep < steps.length ? (
                  <Button 
                    type="button" 
                    className="ml-auto" 
                    onClick={async () => {
                      // Se estiver na etapa 3, valida se os documentos básicos foram selecionados
                      // mas não bloqueia se for opcional
                      await nextStep();
                    }}
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="ml-auto bg-green-600 hover:bg-green-700 px-8" 
                    disabled={isSubmitting}
                    onClick={() => {
                      const errors = form.formState.errors;
                      if (Object.keys(errors).length > 0) {
                        toast.error("Por favor, preencha os campos obrigatórios.");
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Concluir
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
