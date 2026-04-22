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
import type { PontoNotificationProps } from "../types";

const TIPO_LABELS: Record<string, string> = {
  FALTA_INJUSTIFICADA: "Falta Injustificada",
  ATRASO: "Atraso",
  SAIDA_ANTECIPADA: "Saída Antecipada",
  PONTO_NAO_REGISTRADO: "Ponto Não Registrado",
};

const TIPO_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  FALTA_INJUSTIFICADA: "danger",
  ATRASO: "warning",
  SAIDA_ANTECIPADA: "warning",
  PONTO_NAO_REGISTRADO: "default",
};

export function PontoNotificationEmail({
  colaboradorNome,
  data,
  tipo,
  justificativa,
  rapGerado,
}: PontoNotificationProps) {
  const tipoLabel = TIPO_LABELS[tipo] ?? tipo;
  const variant = TIPO_VARIANT[tipo] ?? "default";

  return (
    <BaseEmail
      preview={`Inconformidade de ponto registrada — ${tipoLabel} em ${data}`}
    >
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge variant={variant}>Tratamento de Ponto</EmailBadge>
        </div>
        <EmailHeading>Inconformidade de Ponto Registrada</EmailHeading>
        <EmailSubheading>
          Uma inconformidade foi registrada e tratada pelo setor de RH para o
          dia {data}.
        </EmailSubheading>

        <EmailBody>
          Prezado(a) <strong style={{ color: "#f8f8fc" }}>{colaboradorNome}</strong>,
        </EmailBody>
        <EmailBody>
          Informamos que foi registrado no sistema uma inconformidade de ponto
          referente à data informada abaixo. Caso acredite que houve um erro,
          entre em contato com o setor de RH.
        </EmailBody>

        <EmailInfoCard
          rows={[
            { label: "Colaborador", value: colaboradorNome },
            { label: "Data", value: data },
            { label: "Tipo", value: tipoLabel },
            ...(justificativa
              ? [{ label: "Justificativa", value: justificativa }]
              : []),
            {
              label: "RAP Gerado",
              value: rapGerado ? "Sim — uma penalidade foi registrada" : "Não",
            },
          ]}
        />

        {rapGerado && (
          <Section
            style={{
              backgroundColor: "#2d1010",
              border: "1px solid #5a2020",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <Text
              style={{
                color: "#f87171",
                fontSize: "13px",
                fontWeight: 600,
                margin: "0 0 6px",
              }}
            >
              ⚠ Atenção: RAP Automático Gerado
            </Text>
            <Text
              style={{ color: "#fca5a5", fontSize: "13px", lineHeight: 1.6, margin: 0 }}
            >
              Em decorrência desta inconformidade, uma advertência (RAP) foi
              registrada automaticamente no seu perfil. O acúmulo de
              advertências pode resultar em suspensão ou desligamento.
            </Text>
          </Section>
        )}

        <EmailBody>
          Em caso de dúvidas ou contestação, procure o setor de RH
          imediatamente. Seu histórico de ponto está disponível no sistema.
        </EmailBody>
      </EmailSection>
    </BaseEmail>
  );
}

export default PontoNotificationEmail;
