import * as React from "react";
import { Text, Section, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface PremioEmailProps {
  colaboradorNome: string;
  nomePremio: string;
  valorOuDescricao: string;
  mensagem: string;
}

export const PremioConcedidoEmail = ({
  colaboradorNome,
  nomePremio,
  valorOuDescricao,
  mensagem,
}: PremioEmailProps) => (
  <EmailLayout 
    title="🎉 Parabéns pelo seu Reconhecimento!" 
    preview={`Excelente notícia! Você recebeu o prêmio: ${nomePremio}`}
  >
    <Text className="text-gray-700 text-lg mb-4 text-center">
      Parabéns, <strong>{colaboradorNome}</strong>!
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed text-center">
      Temos o prazer de informar que você foi reconhecido pelo seu excelente desempenho e dedicação. Como forma de agradecimento, você acaba de receber uma nova premiação.
    </Text>
    
    <Section className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mb-6 text-center">
      <Text className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2 m-0">
        Reconhecimento Concedido
      </Text>
      <Text className="text-2xl font-black text-emerald-700 m-0 my-2">
        {nomePremio}
      </Text>
      <Text className="text-gray-600 text-sm mt-2 italic">
        "{mensagem}"
      </Text>
      <Text className="text-emerald-600 font-bold mt-4">
        Valor/Benefício: {valorOuDescricao}
      </Text>
    </Section>

    <Section className="text-center my-8">
      <Button
        className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg"
        href="https://pontocertoapp.xyz/dashboard"
      >
        Ver Meus Prêmios
      </Button>
    </Section>

    <Text className="text-gray-600 mb-4 leading-relaxed text-center">
      Continue com esse brilho e dedicação. Você faz a diferença na nossa equipe!
    </Text>
    
    <Text className="text-gray-600 text-center">
      Com gratidão,<br />
      <strong>Diretoria & RH PontoCerto</strong>
    </Text>
  </EmailLayout>
);

export default PremioConcedidoEmail;
