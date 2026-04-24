import * as React from "react";
import { Text, Section, Hr, Button, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface RelatorioEmailProps {
  gestorNome: string;
  unidade: string;
  periodo: string;
  totalColaboradores: number;
  novasAdmissoes: number;
  penalidadesNoPeriodo: number;
  pendenciasDocumentais: number;
}

export const RelatorioSemanalEmail = ({
  gestorNome,
  unidade,
  periodo,
  totalColaboradores,
  novasAdmissoes,
  penalidadesNoPeriodo,
  pendenciasDocumentais,
}: RelatorioEmailProps) => (
  <EmailLayout 
    title="Resumo Semanal de Gestão" 
    preview={`Relatório PontoCerto: ${unidade} - ${periodo}`}
  >
    <Text className="text-gray-700 text-lg mb-4">
      Olá <strong>{gestorNome}</strong>,
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed">
      Aqui está o resumo dos principais indicadores de RH da unidade <strong>{unidade}</strong> referente ao período de <strong>{periodo}</strong>.
    </Text>
    
    <Section className="mb-6">
      <Row className="mb-4">
        <Column className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mr-2">
          <Text className="text-[10px] font-black uppercase text-gray-400 m-0">Total Equipe</Text>
          <Text className="text-xl font-black m-0">{totalColaboradores}</Text>
        </Column>
        <Column className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <Text className="text-[10px] font-black uppercase text-gray-400 m-0">Novas Admissões</Text>
          <Text className="text-xl font-black m-0 text-blue-600">+{novasAdmissoes}</Text>
        </Column>
      </Row>
      <Row>
        <Column className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mr-2">
          <Text className="text-[10px] font-black uppercase text-gray-400 m-0">Penalidades</Text>
          <Text className="text-xl font-black m-0 text-red-600">{penalidadesNoPeriodo}</Text>
        </Column>
        <Column className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <Text className="text-[10px] font-black uppercase text-gray-400 m-0">Docs Pendentes</Text>
          <Text className="text-xl font-black m-0 text-amber-600">{pendenciasDocumentais}</Text>
        </Column>
      </Row>
    </Section>

    <Hr className="border-gray-200 my-6" />

    <Section className="text-center my-8">
      <Button
        className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg"
        href="https://pontocertoapp.xyz/dashboard"
      >
        Acessar Painel Gerencial
      </Button>
    </Section>

    <Text className="text-gray-600">
      Relatório Automático,<br />
      <strong>PontoCerto Intelligence</strong>
    </Text>
  </EmailLayout>
);

export default RelatorioSemanalEmail;
