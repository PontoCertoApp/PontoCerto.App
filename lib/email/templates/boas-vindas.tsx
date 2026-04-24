import * as React from "react";
import { Text, Button, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

export interface BemVindoEmailProps {
  nomeUsuario: string;
  empresa: string;
  loginUrl: string;
}

export const BemVindoEmail = ({
  nomeUsuario,
  empresa,
  loginUrl,
}: BemVindoEmailProps) => (
  <EmailLayout 
    title="Bem-vindo ao PontoCerto" 
    preview={`Olá ${nomeUsuario}, sua conta na ${empresa} foi criada.`}
  >
    <Text className="text-gray-700 text-lg mb-4">
      Olá <strong>{nomeUsuario}</strong>,
    </Text>
    <Text className="text-gray-600 mb-6 leading-relaxed">
      É um prazer ter você conosco! Sua conta na plataforma PontoCerto da <strong>{empresa}</strong> acaba de ser ativada. Agora você tem acesso a todas as ferramentas de RH, consulta de holerites, controle de ponto e muito mais.
    </Text>
    
    <Section className="text-center my-8">
      <Button
        className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg"
        href={loginUrl}
      >
        Acessar Minha Conta
      </Button>
    </Section>

    <Text className="text-gray-600 mb-4 leading-relaxed">
      Se você tiver qualquer dúvida no seu primeiro acesso, nossa equipe de suporte e o RH da sua unidade estão prontos para ajudar.
    </Text>
    
    <Text className="text-gray-600">
      Atenciosamente,<br />
      <strong>Equipe PontoCerto</strong>
    </Text>
  </EmailLayout>
);

export default BemVindoEmail;
