import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

const BRAND_COLOR = "#6366f1";
const BRAND_DARK = "#0f0f14";
const BRAND_SURFACE = "#17171f";
const BRAND_BORDER = "#2a2a35";
const TEXT_PRIMARY = "#f8f8fc";
const TEXT_MUTED = "#8b8ba0";

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
          * { box-sizing: border-box; }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />
          {children}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <table width="100%" cellPadding={0} cellSpacing={0}>
        <tr>
          <td>
            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td>
                  <div style={logoBadgeStyle}>
                    <span style={logoTextStyle}>PC</span>
                  </div>
                </td>
                <td style={{ paddingLeft: "12px" }}>
                  <Text style={brandNameStyle}>PontoCerto</Text>
                  <Text style={brandTaglineStyle}>RH Integrado</Text>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </Section>
  );
}

function EmailFooter() {
  return (
    <>
      <Hr style={hrStyle} />
      <Section style={footerStyle}>
        <Text style={footerTextStyle}>
          Este é um e-mail automático gerado pelo sistema PontoCerto. Não responda a este e-mail.
        </Text>
        <Text style={footerTextStyle}>
          Em caso de dúvidas, entre em contato com o setor de RH.
        </Text>
        <Text style={{ ...footerTextStyle, marginTop: "16px" }}>
          © {new Date().getFullYear()} PontoCerto · Todos os direitos reservados
        </Text>
      </Section>
    </>
  );
}

export function EmailSection({ children }: { children: React.ReactNode }) {
  return <Section style={sectionStyle}>{children}</Section>;
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={headingStyle}>{children}</Text>;
}

export function EmailSubheading({ children }: { children: React.ReactNode }) {
  return <Text style={subheadingStyle}>{children}</Text>;
}

export function EmailBody({ children }: { children: React.ReactNode }) {
  return <Text style={emailBodyStyle}>{children}</Text>;
}

export function EmailBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colors = {
    default: { bg: "#2a2a4a", text: "#a5b4fc" },
    success: { bg: "#14291f", text: "#4ade80" },
    warning: { bg: "#2d1f00", text: "#fbbf24" },
    danger: { bg: "#2d1010", text: "#f87171" },
  };
  const c = colors[variant];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "100px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

export function EmailInfoCard({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <Section style={infoCardStyle}>
      {rows.map(({ label, value }, i) => (
        <table key={i} width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: i < rows.length - 1 ? "12px" : 0 }}>
          <tr>
            <td style={{ width: "40%" }}>
              <Text style={infoLabelStyle}>{label}</Text>
            </td>
            <td>
              <Text style={infoValueStyle}>{value}</Text>
            </td>
          </tr>
        </table>
      ))}
    </Section>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", margin: "32px 0" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: BRAND_COLOR,
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          padding: "12px 32px",
          borderRadius: "8px",
          letterSpacing: "0.3px",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#0a0a0f",
  margin: 0,
  padding: "40px 0",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: BRAND_DARK,
  borderRadius: "16px",
  border: `1px solid ${BRAND_BORDER}`,
  maxWidth: "600px",
  margin: "0 auto",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: BRAND_SURFACE,
  borderBottom: `1px solid ${BRAND_BORDER}`,
  padding: "20px 32px",
};

const logoBadgeStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  backgroundColor: BRAND_COLOR,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoTextStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  fontStyle: "italic",
  lineHeight: "40px",
  textAlign: "center",
  display: "block",
  width: "100%",
};

const brandNameStyle: React.CSSProperties = {
  color: TEXT_PRIMARY,
  fontSize: "18px",
  fontWeight: 900,
  letterSpacing: "-0.5px",
  margin: 0,
  lineHeight: 1.2,
};

const brandTaglineStyle: React.CSSProperties = {
  color: BRAND_COLOR,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "3px",
  textTransform: "uppercase",
  margin: 0,
};

const sectionStyle: React.CSSProperties = {
  padding: "32px 32px 0",
};

const headingStyle: React.CSSProperties = {
  color: TEXT_PRIMARY,
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.5px",
  margin: "0 0 8px",
  lineHeight: 1.3,
};

const subheadingStyle: React.CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "14px",
  fontWeight: 400,
  margin: "0 0 24px",
  lineHeight: 1.6,
};

const emailBodyStyle: React.CSSProperties = {
  color: "#d1d1e0",
  fontSize: "15px",
  lineHeight: 1.7,
  margin: "0 0 16px",
};

const infoCardStyle: React.CSSProperties = {
  backgroundColor: BRAND_SURFACE,
  borderRadius: "12px",
  border: `1px solid ${BRAND_BORDER}`,
  padding: "20px 24px",
  margin: "24px 0",
};

const infoLabelStyle: React.CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  margin: 0,
};

const infoValueStyle: React.CSSProperties = {
  color: TEXT_PRIMARY,
  fontSize: "14px",
  fontWeight: 500,
  margin: 0,
};

const hrStyle: React.CSSProperties = {
  borderColor: BRAND_BORDER,
  margin: "32px 0 0",
};

const footerStyle: React.CSSProperties = {
  padding: "24px 32px",
};

const footerTextStyle: React.CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "12px",
  lineHeight: 1.6,
  margin: "0 0 4px",
  textAlign: "center",
};
