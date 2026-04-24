import * as React from "react";
import { Text, Section, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface DocumentoEmailProps {
  colaboradorNome: string;
  nomeDocumento: string;
  dataLimite: string;
  linkAssinatura: string;
}

export const DocumentoPendenteEmail = ({
  colaboradorNome,
  nomeDocumento,
  dataLimite,
  linkAssinatura,
}: DocumentoEmailProps) => (
  <EmailLayout 
    title="Ação Necessária: Assinatura de Documento" 
    preview={`Pendente: Assinatura de ${nomeDocumento}`}
  >
    <Text className="text-gray-700 text-lg mb-4">
      Olá <strong>{colaboradorNome}</strong>,
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed">
      Você tem um novo documento que requer sua assinatura digital para regularização. Favor realizar o acesso e assinar o quanto antes.
    </Text>
    
    <Section className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6">
      <Text className="text-sm text-gray-700 my-1">
        <strong>Documento:</strong> {nomeDocumento}
      </Text>
      <Text className="text-sm text-gray-700 my-1">
        <strong>Data Limite:</strong> <span className="text-amber-700 font-bold">{dataLimite}</span>
      </Text>
    </Section>

    <Section className="text-center my-8">
      <Button
        className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg"
        href={linkAssinatura}
      >
        Acessar e Assinar Agora
      </Button>
    </Section>

    <Text className="text-gray-600 mb-4 leading-relaxed text-sm">
      Lembre-se que a regularização documental é essencial para evitar bloqueios em benefícios e pagamentos.
    </Text>
    
    <Text className="text-gray-600">
      Departamento de RH,<br />
      <strong>PontoCerto</strong>
    </Text>
  </EmailLayout>
);

export default DocumentoPendenteEmail;
