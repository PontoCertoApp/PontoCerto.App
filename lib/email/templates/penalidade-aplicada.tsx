import * as React from "react";
import { Text, Section, Hr, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface PenalidadeEmailProps {
  colaboradorNome: string;
  tipoPenalidade: string;
  motivo: string;
  dataOcorrencia: string;
  linkDocumento: string;
}

export const PenalidadeAplicadaEmail = ({
  colaboradorNome,
  tipoPenalidade,
  motivo,
  dataOcorrencia,
  linkDocumento,
}: PenalidadeEmailProps) => (
  <EmailLayout 
    title="Notificação de Medida Disciplinar" 
    preview={`Importante: Notificação de ${tipoPenalidade}`}
  >
    <Text className="text-gray-700 text-lg mb-4">
      Olá <strong>{colaboradorNome}</strong>,
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed">
      Esta é uma notificação formal referente a uma medida disciplinar registrada em seu histórico funcional. Reforçamos o compromisso com as normas internas e a boa convivência profissional.
    </Text>
    
    <Section className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-6">
      <Text className="text-xs font-black uppercase tracking-widest text-red-600 mb-4 m-0">
        Dados da Ocorrência
      </Text>
      <Hr className="border-red-200 my-2" />
      <Text className="text-sm text-gray-700 my-1">
        <strong>Tipo:</strong> {tipoPenalidade}
      </Text>
      <Text className="text-sm text-gray-700 my-1">
        <strong>Data:</strong> {dataOcorrencia}
      </Text>
      <Text className="text-sm text-gray-700 mt-3 italic">
        <strong>Motivo:</strong> {motivo}
      </Text>
    </Section>

    <Section className="text-center my-8">
      <Button
        className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg"
        href={linkDocumento}
      >
        Visualizar Documento Completo
      </Button>
    </Section>

    <Text className="text-gray-600 mb-4 leading-relaxed italic text-sm">
      Em caso de dúvidas ou necessidade de contestação, favor procurar o seu gestor imediato ou o departamento de RH.
    </Text>
    
    <Text className="text-gray-600">
      Departamento de RH,<br />
      <strong>PontoCerto</strong>
    </Text>
  </EmailLayout>
);

export default PenalidadeAplicadaEmail;
