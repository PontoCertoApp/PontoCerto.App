import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface ColaboradorEmailProps {
  rhNome: string;
  colaboradorNome: string;
  cargo: string;
  setor: string;
  dataAdmissao: string;
}

export const ColaboradorCadastradoEmail = ({
  rhNome,
  colaboradorNome,
  cargo,
  setor,
  dataAdmissao,
}: ColaboradorEmailProps) => (
  <EmailLayout 
    title="Novo Colaborador Cadastrado" 
    preview={`Aviso de admissão: ${colaboradorNome} (${cargo})`}
  >
    <Text className="text-gray-700 text-lg mb-4">
      Olá <strong>{rhNome}</strong>,
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed">
      Um novo colaborador foi registrado com sucesso no sistema e está aguardando os próximos passos da integração.
    </Text>
    
    <Section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
      <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 m-0">
        Detalhes do Registro
      </Text>
      <Hr className="border-gray-200 my-2" />
      <Text className="text-sm text-gray-700 my-1">
        <strong>Nome:</strong> {colaboradorNome}
      </Text>
      <Text className="text-sm text-gray-700 my-1">
        <strong>Cargo:</strong> {cargo}
      </Text>
      <Text className="text-sm text-gray-700 my-1">
        <strong>Setor:</strong> {setor}
      </Text>
      <Text className="text-sm text-gray-700 my-1">
        <strong>Data de Admissão:</strong> {dataAdmissao}
      </Text>
    </Section>

    <Text className="text-gray-600 mb-4 leading-relaxed">
      Favor verificar se toda a documentação foi anexada corretamente para prosseguir com a efetivação no sistema de folha.
    </Text>
    
    <Text className="text-gray-600">
      Sistema de Gestão,<br />
      <strong>PontoCerto RH</strong>
    </Text>
  </EmailLayout>
);

export default ColaboradorCadastradoEmail;
