import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  BaseEmail,
  EmailSection,
  EmailHeading,
  EmailSubheading,
  EmailBody,
  EmailInfoCard,
  EmailBadge,
} from "./_base";
import type { PremioNotificationProps } from "../types";

export function PremioNotificationEmail({
  colaboradorNome,
  tipoPremio,
  valor,
  mesReferencia,
  observacao,
}: PremioNotificationProps) {
  const valorFormatado = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <BaseEmail
      preview={`Parabéns! Você recebeu um prêmio — ${tipoPremio}`}
    >
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge variant="success">Prêmio Concedido</EmailBadge>
        </div>
        <EmailHeading>Parabéns, {colaboradorNome.split(" ")[0]}!</EmailHeading>
        <EmailSubheading>
          Seu desempenho foi reconhecido pela gestão. Um prêmio foi registrado
          e será processado no próximo ciclo de pagamento.
        </EmailSubheading>

        <EmailBody>
          É com satisfação que comunicamos a concessão do seguinte incentivo
          financeiro ao seu perfil:
        </EmailBody>

        <Section
          style={{
            background: "linear-gradient(135deg, #1a1f3a 0%, #0f1221 100%)",
            border: "1px solid #2a3060",
            borderRadius: "16px",
            padding: "28px 24px",
            textAlign: "center",
            margin: "24px 0",
          }}
        >
          <Text
            style={{
              color: "#a5b4fc",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            {tipoPremio}
          </Text>
          <Text
            style={{
              color: "#ffffff",
              fontSize: "40px",
              fontWeight: 900,
              letterSpacing: "-1px",
              margin: "0 0 8px",
              lineHeight: 1,
            }}
          >
            {valorFormatado}
          </Text>
          <Text
            style={{
              color: "#6366f1",
              fontSize: "13px",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Referência: {mesReferencia}
          </Text>
        </Section>

        <EmailInfoCard
          rows={[
            { label: "Colaborador", value: colaboradorNome },
            { label: "Tipo de Prêmio", value: tipoPremio },
            { label: "Valor", value: valorFormatado },
            { label: "Mês de Referência", value: mesReferencia },
            ...(observacao ? [{ label: "Observação", value: observacao }] : []),
          ]}
        />

        <EmailBody>
          O valor será creditado de acordo com as regras do programa de
          incentivos da empresa. Em caso de dúvidas sobre o pagamento, consulte
          o setor financeiro ou de RH.
        </EmailBody>

        <Section
          style={{
            backgroundColor: "#0d1f14",
            border: "1px solid #14532d",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "32px",
          }}
        >
          <Text
            style={{
              color: "#4ade80",
              fontSize: "13px",
              fontWeight: 600,
              margin: "0 0 4px",
            }}
          >
            Continue assim!
          </Text>
          <Text
            style={{ color: "#86efac", fontSize: "13px", lineHeight: 1.6, margin: 0 }}
          >
            Seu comprometimento e desempenho são fundamentais para o sucesso da
            equipe. Obrigado por fazer parte do time PontoCerto.
          </Text>
        </Section>
      </EmailSection>
    </BaseEmail>
  );
}

export default PremioNotificationEmail;
