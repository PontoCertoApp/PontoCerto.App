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
import type { PenalidadeNotificationProps } from "../types";

const TIPO_LABELS: Record<string, string> = {
  INCONSISTENCIA_PONTO: "Inconsistência de Ponto",
  QUEDA_CONDUTA: "Queda de Conduta",
  ADVERTENCIA: "Advertência Formal",
  SUSPENSAO: "Suspensão",
};

export function PenalidadeNotificationEmail({
  colaboradorNome,
  tipo,
  descricao,
  dataOcorrencia,
  validadeAte,
  status,
}: PenalidadeNotificationProps) {
  const tipoLabel = TIPO_LABELS[tipo] ?? tipo;
  const isSuspensao = tipo === "SUSPENSAO";

  return (
    <BaseEmail
      preview={`Notificação de penalidade — ${tipoLabel} registrada`}
    >
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge variant="danger">Penalidade / RAP</EmailBadge>
        </div>
        <EmailHeading>
          {isSuspensao ? "Suspensão Registrada" : "Advertência Registrada"}
        </EmailHeading>
        <EmailSubheading>
          Uma penalidade disciplinar foi aplicada e registrada formalmente em
          seu perfil no sistema PontoCerto.
        </EmailSubheading>

        <EmailBody>
          Prezado(a) <strong style={{ color: "#f8f8fc" }}>{colaboradorNome}</strong>,
        </EmailBody>
        <EmailBody>
          Informamos que, após avaliação do setor de Recursos Humanos, foi
          registrada uma {tipoLabel.toLowerCase()} referente à ocorrência
          descrita abaixo. Este documento possui validade formal e integra seu
          histórico disciplinar.
        </EmailBody>

        <EmailInfoCard
          rows={[
            { label: "Colaborador", value: colaboradorNome },
            { label: "Tipo de Penalidade", value: tipoLabel },
            { label: "Data da Ocorrência", value: dataOcorrencia },
            { label: "Válida Até", value: validadeAte },
            { label: "Status", value: status },
          ]}
        />

        <Section
          style={{
            backgroundColor: "#1a1208",
            border: "1px solid #4a3200",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <Text
            style={{
              color: "#fbbf24",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Descrição da Ocorrência
          </Text>
          <Text
            style={{ color: "#fde68a", fontSize: "14px", lineHeight: 1.7, margin: 0 }}
          >
            {descricao}
          </Text>
        </Section>

        {isSuspensao && (
          <Section
            style={{
              backgroundColor: "#2d1010",
              border: "1px solid #7f1d1d",
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
              ⚠ Atenção: Suspensão Ativa
            </Text>
            <Text
              style={{ color: "#fca5a5", fontSize: "13px", lineHeight: 1.6, margin: 0 }}
            >
              Você está suspenso durante o período de validade desta penalidade.
              Uma nova ocorrência após este período pode resultar em
              encerramento do vínculo empregatício por justa causa.
            </Text>
          </Section>
        )}

        <EmailBody>
          Caso deseje contestar esta penalidade, você tem o prazo de{" "}
          <strong style={{ color: "#f8f8fc" }}>5 dias úteis</strong> para
          solicitar revisão junto ao setor de RH. Após este prazo, a penalidade
          será considerada aceita.
        </EmailBody>
      </EmailSection>
    </BaseEmail>
  );
}

export default PenalidadeNotificationEmail;
