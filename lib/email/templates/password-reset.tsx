import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  BaseEmail,
  EmailSection,
  EmailHeading,
  EmailSubheading,
  EmailBody,
  EmailButton,
  EmailBadge,
} from "./_base";
import type { PasswordResetProps } from "../types";

export function PasswordResetEmail({
  colaboradorNome,
  resetUrl,
  expiresIn,
}: PasswordResetProps) {
  return (
    <BaseEmail
      preview={`Redefinição de senha solicitada — PontoCerto`}
    >
      <EmailSection>
        <div style={{ marginBottom: "8px" }}>
          <EmailBadge variant="warning">Redefinição de Senha</EmailBadge>
        </div>
        <EmailHeading>Recuperação de Acesso</EmailHeading>
        <EmailSubheading>
          Uma solicitação de redefinição de senha foi feita para sua conta no
          PontoCerto.
        </EmailSubheading>

        <EmailBody>
          Olá, <strong style={{ color: "#f8f8fc" }}>{colaboradorNome}</strong>.
        </EmailBody>
        <EmailBody>
          Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha. Este link é válido
          por <strong style={{ color: "#f8f8fc" }}>{expiresIn}</strong>.
        </EmailBody>
      </EmailSection>

      <EmailButton href={resetUrl}>Redefinir Minha Senha</EmailButton>

      <EmailSection>
        <Section
          style={{
            backgroundColor: "#1a1208",
            border: "1px solid #4a3200",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "16px",
          }}
        >
          <Text
            style={{
              color: "#fbbf24",
              fontSize: "13px",
              fontWeight: 600,
              margin: "0 0 6px",
            }}
          >
            ⚠ Não solicitou a redefinição?
          </Text>
          <Text
            style={{ color: "#fde68a", fontSize: "13px", lineHeight: 1.6, margin: 0 }}
          >
            Se você não fez esta solicitação, ignore este e-mail. Sua senha
            permanecerá a mesma e nenhuma alteração será feita. Recomendamos
            que entre em contato com o TI caso suspeite de acesso não
            autorizado.
          </Text>
        </Section>

        <Text
          style={{
            color: "#8b8ba0",
            fontSize: "12px",
            lineHeight: 1.6,
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          Por segurança, este link expira em {expiresIn} e só pode ser usado
          uma vez. Após a redefinição, o link será invalidado automaticamente.
        </Text>
      </EmailSection>
    </BaseEmail>
  );
}

export default PasswordResetEmail;
