import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  BaseEmail,
  EmailSection,
  EmailHeading,
  EmailSubheading,
  EmailBody,
  EmailInfoCard,
  EmailButton,
  EmailBadge,
} from "./_base";
import type { WelcomeEmailProps } from "../types";

export function WelcomeEmail({
  colaboradorNome,
  cargo,
  loja,
  dataAdmissao,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <BaseEmail preview={`Bem-vindo ao PontoCerto, ${colaboradorNome}!`}>
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge variant="success">Novo Colaborador</EmailBadge>
        </div>
        <EmailHeading>Seja bem-vindo, {colaboradorNome.split(" ")[0]}!</EmailHeading>
        <EmailSubheading>
          Sua conta no PontoCerto foi criada com sucesso. A partir de agora você
          tem acesso ao sistema de RH integrado da empresa.
        </EmailSubheading>

        <EmailBody>
          Estamos felizes em tê-lo(a) em nossa equipe. Abaixo estão as informações
          do seu cadastro para conferência:
        </EmailBody>

        <EmailInfoCard
          rows={[
            { label: "Colaborador", value: colaboradorNome },
            { label: "Cargo", value: cargo },
            { label: "Unidade", value: loja },
            { label: "Data de Admissão", value: dataAdmissao },
          ]}
        />

        <EmailBody>
          Use o link abaixo para acessar sua conta pela primeira vez. Recomendamos
          que altere sua senha no primeiro acesso.
        </EmailBody>
      </EmailSection>

      <EmailButton href={loginUrl}>Acessar o PontoCerto</EmailButton>

      <EmailSection>
        <Section
          style={{
            backgroundColor: "#17171f",
            border: "1px solid #2a2a35",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "32px",
          }}
        >
          <Text
            style={{
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Dica de Segurança
          </Text>
          <Text
            style={{
              color: "#8b8ba0",
              fontSize: "13px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Nunca compartilhe suas credenciais de acesso. O time de RH jamais
            solicitará sua senha por e-mail ou telefone.
          </Text>
        </Section>
      </EmailSection>
    </BaseEmail>
  );
}

export default WelcomeEmail;
