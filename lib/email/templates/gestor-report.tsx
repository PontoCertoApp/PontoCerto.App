import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";
import {
  BaseEmail,
  EmailSection,
  EmailHeading,
  EmailSubheading,
  EmailBody,
  EmailBadge,
} from "./_base";
import type { GestorReportProps } from "../types";

function MetricCard({
  label,
  value,
  sub,
  color = "#6366f1",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#17171f",
        border: "1px solid #2a2a35",
        borderRadius: "12px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <Text
        style={{ color, fontSize: "28px", fontWeight: 900, margin: 0, lineHeight: 1 }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: "#8b8ba0",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          margin: "6px 0 0",
        }}
      >
        {label}
      </Text>
      {sub && (
        <Text style={{ color: "#6b6b80", fontSize: "11px", margin: "2px 0 0" }}>
          {sub}
        </Text>
      )}
    </div>
  );
}

export function GestorReportEmail({
  gestorNome,
  periodo,
  loja,
  totalColaboradores,
  totalAtivos,
  totalInconformidades,
  totalPenalidades,
  totalPremios,
  valorTotalPremios,
  colaboradoresDestaque,
}: GestorReportProps) {
  const valorFormatado = valorTotalPremios.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const taxaPresenca =
    totalColaboradores > 0
      ? Math.round(
          ((totalColaboradores - totalInconformidades) / totalColaboradores) *
            100
        )
      : 0;

  return (
    <BaseEmail
      preview={`Relatório Gerencial — ${loja} · ${periodo}`}
    >
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge>Relatório Gerencial</EmailBadge>
        </div>
        <EmailHeading>Relatório Periódico</EmailHeading>
        <EmailSubheading>
          {loja} · {periodo}
        </EmailSubheading>

        <EmailBody>
          Olá, <strong style={{ color: "#f8f8fc" }}>{gestorNome}</strong>.
          Segue o resumo gerencial do período{" "}
          <strong style={{ color: "#f8f8fc" }}>{periodo}</strong> para a unidade{" "}
          <strong style={{ color: "#f8f8fc" }}>{loja}</strong>.
        </EmailBody>
      </EmailSection>

      {/* Metrics grid */}
      <EmailSection>
        <Text
          style={{
            color: "#6366f1",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          Indicadores do Período
        </Text>

        <Row style={{ marginBottom: "12px" }}>
          <Column style={{ paddingRight: "6px" }}>
            <MetricCard
              label="Colaboradores"
              value={totalColaboradores}
              sub={`${totalAtivos} ativos`}
            />
          </Column>
          <Column style={{ paddingLeft: "6px" }}>
            <MetricCard
              label="Taxa de Presença"
              value={`${taxaPresenca}%`}
              color={taxaPresenca >= 90 ? "#4ade80" : "#fbbf24"}
            />
          </Column>
        </Row>

        <Row style={{ marginBottom: "12px" }}>
          <Column style={{ paddingRight: "6px" }}>
            <MetricCard
              label="Inconformidades"
              value={totalInconformidades}
              color={totalInconformidades > 5 ? "#f87171" : "#fbbf24"}
            />
          </Column>
          <Column style={{ paddingLeft: "6px" }}>
            <MetricCard
              label="Penalidades"
              value={totalPenalidades}
              color={totalPenalidades > 3 ? "#f87171" : "#8b8ba0"}
            />
          </Column>
        </Row>

        <Row style={{ marginBottom: "24px" }}>
          <Column style={{ paddingRight: "6px" }}>
            <MetricCard
              label="Prêmios Concedidos"
              value={totalPremios}
              color="#4ade80"
            />
          </Column>
          <Column style={{ paddingLeft: "6px" }}>
            <MetricCard
              label="Volume de Prêmios"
              value={valorFormatado}
              color="#4ade80"
            />
          </Column>
        </Row>
      </EmailSection>

      {colaboradoresDestaque.length > 0 && (
        <EmailSection>
          <Text
            style={{
              color: "#6366f1",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            Colaboradores em Destaque
          </Text>

          <Section
            style={{
              backgroundColor: "#17171f",
              border: "1px solid #2a2a35",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <Row
              style={{
                borderBottom: "1px solid #2a2a35",
                padding: "10px 16px",
              }}
            >
              <Column style={{ width: "50%" }}>
                <Text
                  style={{
                    color: "#8b8ba0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Colaborador
                </Text>
              </Column>
              <Column style={{ width: "30%" }}>
                <Text
                  style={{
                    color: "#8b8ba0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Cargo
                </Text>
              </Column>
              <Column style={{ width: "20%", textAlign: "right" }}>
                <Text
                  style={{
                    color: "#8b8ba0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Prêmios
                </Text>
              </Column>
            </Row>

            {colaboradoresDestaque.map((c, i) => (
              <Row
                key={i}
                style={{
                  padding: "12px 16px",
                  borderBottom:
                    i < colaboradoresDestaque.length - 1
                      ? "1px solid #2a2a35"
                      : "none",
                }}
              >
                <Column style={{ width: "50%" }}>
                  <Text
                    style={{ color: "#f8f8fc", fontSize: "13px", fontWeight: 500, margin: 0 }}
                  >
                    {c.nome}
                  </Text>
                </Column>
                <Column style={{ width: "30%" }}>
                  <Text style={{ color: "#8b8ba0", fontSize: "13px", margin: 0 }}>
                    {c.cargo}
                  </Text>
                </Column>
                <Column style={{ width: "20%", textAlign: "right" }}>
                  <Text
                    style={{ color: "#4ade80", fontSize: "13px", fontWeight: 700, margin: 0 }}
                  >
                    {c.premios}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>
        </EmailSection>
      )}

      <EmailSection>
        <Text
          style={{
            color: "#8b8ba0",
            fontSize: "12px",
            lineHeight: 1.7,
            margin: "16px 0 32px",
          }}
        >
          Este relatório é gerado automaticamente pelo sistema PontoCerto.
          Para dados detalhados, acesse o módulo de Relatórios no painel de
          gestão. Relatório gerado em {new Date().toLocaleDateString("pt-BR")}.
        </Text>
      </EmailSection>
    </BaseEmail>
  );
}

export default GestorReportEmail;
