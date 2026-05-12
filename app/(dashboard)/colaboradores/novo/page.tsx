"use client";

import { useState, useEffect } from "react";
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
  Loader2,
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { getLojas } from "@/actions/loja-actions";
import { getSetores } from "@/actions/setor-actions";
import { getFuncoes } from "@/actions/funcao-actions";
import { createColaborador } from "@/actions/colaborador-actions";
import { getTimes } from "@/actions/team-actions";

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
  teamId: z.string().optional(),
  setorNome: z.string().min(1, "Obrigatório"),
  funcaoNome: z.string().min(1, "Obrigatório"),
  agenciaBB: z.string().min(4, "Agência inválida"),
  contaBB: z.string().min(5, "Conta inválida"),
  possuiFilhosMenores14: z.boolean().default(false),

  enderecoComprovantePath: z.string().optional(),
  pisFotoPath: z.string().optional(),
  historicoEscolarPath: z.string().optional(),
  ctpsDigitalPath: z.string().optional(),
  certidaoFilhosPath: z.string().optional(),
  fotoPerfilPath: z.string().optional(),
  contratoAssinadoPath: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Combobox: plain text input + floating suggestion list.
 *
 * - Dropdown opens ONLY while the user is typing (not on focus/click).
 * - On blur without selecting, restores `selectedName` (the last confirmed name).
 * - `selectedId` is the hidden value stored in the form; `selectedName` is the
 *   matching display text derived by the parent from the items list.
 */
function ComboboxField({
  placeholder,
  items,
  selectedId,
  selectedName,
  onSelect,
  onClear,
  disabled,
}: {
  placeholder: string;
  items: { id: string; nome: string }[];
  selectedId: string;
  selectedName: string;
  onSelect: (id: string, nome: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [inputText, setInputText] = useState(selectedName);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync display text when the confirmed selection changes externally
  // (e.g. time field reset when loja changes).
  useEffect(() => {
    setInputText(selectedName);
  }, [selectedName]);

  const suggestions =
    inputText.trim().length > 0
      ? items.filter((i) => i.nome.toLowerCase().includes(inputText.toLowerCase()))
      : [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputText(val);
    setShowSuggestions(val.length > 0);
    if (!val) onClear();
  }

  function handleBlur() {
    // Delay so a click on a suggestion fires before the blur closes the list.
    setTimeout(() => {
      setShowSuggestions(false);
      // Only sync text with the confirmed name if something is actually selected.
      // If nothing is selected, keep whatever the user typed (don't wipe it).
      if (selectedId) {
        setInputText(selectedName);
      }
    }, 150);
  }

  function handleSelect(item: { id: string; nome: string }) {
    setInputText(item.nome);
    setShowSuggestions(false);
    onSelect(item.id, item.nome);
  }

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={inputText}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="off"
      />
      {showSuggestions && !disabled && (
        <>
          {suggestions.length > 0 ? (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                >
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 text-primary transition-opacity ${
                      selectedId === item.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item.nome}
                </button>
              ))}
            </div>
          ) : (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function NovoColaboradorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lojas, setLojas] = useState<{ id: string; nome: string }[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [funcoes, setFuncoes] = useState<any[]>([]);
  const [times, setTimes] = useState<{ id: string; nome: string }[]>([]);

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
      teamId: "",
      setorNome: "",
      funcaoNome: "",
      agenciaBB: "",
      contaBB: "",
      possuiFilhosMenores14: false,
    },
  });

  // Derive display names from the loaded lists — no separate display-text state needed.
  const currentLojaId = form.watch("lojaId") ?? "";
  const currentTeamId = form.watch("teamId") ?? "";
  const selectedLojaName = lojas.find((l) => l.id === currentLojaId)?.nome ?? "";
  const selectedTimeName = times.find((t) => t.id === currentTeamId)?.nome ?? "";

  useEffect(() => {
    async function loadData() {
      const [lojasData, setoresData, funcoesData] = await Promise.all([
        getLojas(),
        getSetores(),
        getFuncoes(),
      ]);
      setLojas(lojasData as { id: string; nome: string }[]);
      setSetores(setoresData);
      setFuncoes(funcoesData);
    }
    loadData();
  }, []);

  async function handleLojaSelect(id: string) {
    form.setValue("lojaId", id);
    form.setValue("teamId", "");
    const timesData = await getTimes(id);
    setTimes(timesData as { id: string; nome: string }[]);
  }

  function handleLojaClear() {
    form.setValue("lojaId", "");
    form.setValue("teamId", "");
    setTimes([]);
  }

  function handleTimeSelect(id: string) {
    form.setValue("teamId", id);
  }

  function handleTimeClear() {
    form.setValue("teamId", "");
  }

  const progress = (currentStep / steps.length) * 100;

  async function nextStep() {
    if (currentStep >= steps.length) return;
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["nomeCompleto", "cpf", "rg", "dataNascimento", "telefonePrincipal"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["setorNome", "funcaoNome", "agenciaBB", "contaBB"];
    }
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  }

  function prevStep() {
    setCurrentStep((prev) => prev - 1);
  }

  async function onSubmit(values: FormValues) {
    if (currentStep < steps.length) return;
    setIsSubmitting(true);
    const result = await createColaborador({
      ...values,
      contaBancoBrasil: `Ag: ${values.agenciaBB} | Cc: ${values.contaBB}`,
    } as any);
    if (result.success) {
      toast.success("Colaborador cadastrado com sucesso!");
      router.push("/colaboradores");
    } else {
      toast.error((result.error as string) || "Erro ao salvar cadastro.");
    }
    setIsSubmitting(false);
  }

  const handleFileUpload = async (fieldName: keyof FormValues) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const promise = fetch("/api/upload", { method: "POST", body: formData }).then(
        async (res) => {
          const data = await res.json();
          if (data.success) {
            form.setValue(fieldName, data.path);
            return data;
          }
          throw new Error(data.error || "Erro no upload");
        }
      );
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:bg-transparent text-primary"
              onClick={() => router.push("/colaboradores")}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
          <p className="text-muted-foreground">Siga as etapas para realizar o cadastro completo.</p>
        </div>
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
              <span
                className={`text-xs font-medium ${
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
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
                    className="space-y-8"
                  >
                    {/* Dados Profissionais */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Dados Profissionais</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Loja — combobox */}
                        <FormField
                          control={form.control}
                          name="lojaId"
                          render={() => (
                            <FormItem>
                              <FormLabel>Loja</FormLabel>
                              <FormControl>
                                <ComboboxField
                                  placeholder="Digite o nome da loja..."
                                  items={lojas}
                                  selectedId={currentLojaId}
                                  selectedName={selectedLojaName}
                                  onSelect={(id) => handleLojaSelect(id)}
                                  onClear={handleLojaClear}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Time — combobox, filtrado pela loja */}
                        <FormField
                          control={form.control}
                          name="teamId"
                          render={() => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <ComboboxField
                                  placeholder={
                                    !currentLojaId
                                      ? "Selecione a loja primeiro"
                                      : "Digite o nome do time..."
                                  }
                                  items={times}
                                  selectedId={currentTeamId}
                                  selectedName={selectedTimeName}
                                  onSelect={(id) => handleTimeSelect(id)}
                                  onClear={handleTimeClear}
                                  disabled={!currentLojaId}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Setor */}
                        <FormField
                          control={form.control}
                          name="setorNome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setor</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Ex: Operacional, Administrativo..."
                                    list="setores-list"
                                    {...field}
                                  />
                                  <datalist id="setores-list">
                                    {setores.map((s: any) => (
                                      <option key={s.id} value={s.nome} />
                                    ))}
                                  </datalist>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Função */}
                        <FormField
                          control={form.control}
                          name="funcaoNome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Função (Cargo)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Ex: Atendente, Gerente..."
                                    list="funcoes-list"
                                    {...field}
                                  />
                                  <datalist id="funcoes-list">
                                    {funcoes.map((f: any) => (
                                      <option key={f.id} value={f.nome} />
                                    ))}
                                  </datalist>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Dados Bancários */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-yellow-400 text-[10px] font-bold text-blue-900 border border-blue-900 shadow-sm">
                            BB
                          </div>
                          <h3 className="font-semibold text-lg">Conta para Pagamento</h3>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Exclusivo Banco do Brasil
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <FormField
                          control={form.control}
                          name="agenciaBB"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agência BB</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0000-0"
                                  maxLength={6}
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    field.onChange(
                                      val.length <= 4
                                        ? val
                                        : `${val.slice(0, 4)}-${val.slice(4, 5)}`
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="text-[10px]">
                                Apenas números e o dígito verificador.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contaBB"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta Corrente BB</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00000-0"
                                  maxLength={10}
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    field.onChange(
                                      val.length <= 5
                                        ? val
                                        : `${val.slice(0, -1)}-${val.slice(-1)}`
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="text-[10px]">
                                Inclua o dígito (ex: 12345-6).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="possuiFilhosMenores14"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Possui filhos menores de 14 anos?
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Se ativado, habilitará o campo de Certidão de Nascimento na próxima
                              etapa.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                      <h3 className="text-lg font-medium">
                        Upload de Documentos, Foto e Contrato
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Formatos aceitos: PDF e Imagens (PNG/JPG)
                      </p>
                    </div>

                    {[
                      { label: "Comprovante de Endereço", name: "enderecoComprovantePath" },
                      { label: "Foto do PIS", name: "pisFotoPath" },
                      { label: "Histórico Escolar / Certificado", name: "historicoEscolarPath" },
                      { label: "CTPS Digital", name: "ctpsDigitalPath" },
                      { label: "Contrato Assinado", name: "contratoAssinadoPath" },
                    ].map((doc) => {
                      const isUploaded = !!form.watch(doc.name as any);
                      return (
                        <div
                          key={doc.name}
                          className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50 transition-all duration-300"
                        >
                          <span className="text-sm font-medium">{doc.label}</span>
                          <Button
                            type="button"
                            variant={isUploaded ? "default" : "outline"}
                            className={`w-full transition-all duration-500 ${
                              isUploaded
                                ? "bg-green-600 hover:bg-green-700 border-green-600"
                                : "bg-background"
                            }`}
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
                      );
                    })}

                    {form.watch("possuiFilhosMenores14") && (
                      <div className="flex flex-col gap-2 p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/10 md:col-span-2">
                        <span className="text-sm font-medium">
                          Certidão de Nascimento (Filhos)
                        </span>
                        <Button
                          type="button"
                          variant={form.watch("certidaoFilhosPath") ? "default" : "outline"}
                          className={`w-full transition-all ${
                            form.watch("certidaoFilhosPath")
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-background"
                          }`}
                          onClick={() => handleFileUpload("certidaoFilhosPath")}
                        >
                          {form.watch("certidaoFilhosPath") ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {form.watch("certidaoFilhosPath")
                            ? "Certidão Enviada"
                            : "Upload Certidão"}
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
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await nextStep();
                    }}
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="ml-auto bg-green-600 hover:bg-green-700 px-8"
                    disabled={isSubmitting}
                    onClick={async (e) => {
                      e.preventDefault();
                      const isValid = await form.trigger();
                      if (isValid) {
                        form.handleSubmit(onSubmit)();
                      } else {
                        toast.error("Por favor, preencha todos os campos obrigatórios.");
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
