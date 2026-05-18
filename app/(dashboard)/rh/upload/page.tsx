"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { Upload, CheckCircle2, Clock, FileText, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Perfil OPERADOR DE UPLOAD — restrito a upload de documentos pendentes
// Não acessa histórico disciplinar, dados financeiros, configurações

interface DocumentoPendente {
  id: string;
  nome: string;
  status: string;
  colaborador: { nomeCompleto: string; loja: { nome: string } };
  createdAt: string;
}

export default function RhUploadPage() {
  const [documentos, setDocumentos] = useState<DocumentoPendente[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function fetchPendentes() {
    setLoading(true);
    try {
      const res = await fetch("/api/documentos?status=PENDENTE").catch(() => null);
      if (!res) return;
      const data = await res.json();
      setDocumentos(Array.isArray(data) ? data : data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPendentes(); }, []);

  async function handleUpload(docId: string, file: File) {
    setUploading((prev) => ({ ...prev, [docId]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        toast.error("Falha no upload do arquivo");
        return;
      }
      const { path } = await uploadRes.json();

      // Atualiza o documento com o caminho do arquivo e muda status para ENVIADO
      const updateRes = await fetch(`/api/documentos/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, status: "ENVIADO" }),
      });

      if (!updateRes.ok) {
        toast.error("Arquivo enviado mas falha ao vincular ao documento");
        return;
      }

      toast.success("Documento enviado com sucesso! RH notificado para conferência.");
      fetchPendentes();
    } finally {
      setUploading((prev) => ({ ...prev, [docId]: false }));
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="size-6 text-primary" /> Envio de Documentos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Documentos pendentes de digitalização atribuídos a você
        </p>
      </div>

      {/* Instrução */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 text-sm text-blue-800">
          <strong>Como funciona:</strong> Selecione o arquivo digitalizado (PDF ou imagem) para cada
          documento abaixo. Após o envio, o RH será notificado para conferir e validar.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Pendentes</CardTitle>
          <CardDescription>{documentos.length} documento(s) aguardando upload</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="size-12 mx-auto mb-3 text-green-400" />
              <p className="font-medium">Tudo em dia!</p>
              <p className="text-sm">Nenhum documento pendente de upload.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{doc.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.colaborador.nomeCompleto} — {doc.colaborador.loja.nome}
                      </div>
                      <Badge className="mt-1 bg-amber-100 text-amber-800 border-0 text-xs">
                        <Clock className="size-3 mr-1" /> Pendente
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={(el) => { inputRefs.current[doc.id] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.id, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => inputRefs.current[doc.id]?.click()}
                      disabled={uploading[doc.id]}
                    >
                      {uploading[doc.id] ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="size-3 mr-1" /> Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
