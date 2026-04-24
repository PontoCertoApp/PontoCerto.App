import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  preview: string;
  title: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, title, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-[580px]">
            <Section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* Header */}
              <Section className="bg-[#0f172a] p-8 text-center">
                <Img
                  src="https://pontocertoapp.xyz/logo-white.png" // Placeholder URL for logo
                  width="180"
                  height="40"
                  alt="PontoCerto"
                  className="mx-auto mb-4"
                />
                <Heading className="text-white text-2xl font-black m-0 tracking-tight">
                  {title}
                </Heading>
              </Section>

              {/* Content */}
              <Section className="p-8">
                {children}
              </Section>

              {/* Footer */}
              <Section className="bg-gray-50 p-8 border-t border-gray-100 text-center">
                <Text className="text-gray-400 text-xs m-0">
                  © {new Date().getFullYear()} PontoCerto RH Integrado. Todos os direitos reservados.
                </Text>
                <Text className="text-gray-400 text-xs mt-2">
                  Esta é uma mensagem automática, por favor não responda.
                </Text>
              </Section>
            </Section>
            <Section className="text-center mt-6">
              <Link href="https://pontocertoapp.xyz" className="text-gray-400 text-xs underline">
                Acesse o Portal do Colaborador
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
