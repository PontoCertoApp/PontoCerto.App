import { getResend } from "./resend";
import { BemVindoEmail, BemVindoEmailProps } from "./templates/boas-vindas";
import { ColaboradorCadastradoEmail, ColaboradorEmailProps } from "./templates/colaborador-cadastrado";
import { PenalidadeAplicadaEmail, PenalidadeEmailProps } from "./templates/penalidade-aplicada";
import { PremioConcedidoEmail, PremioEmailProps } from "./templates/premio-concedido";
import { DocumentoPendenteEmail, DocumentoEmailProps } from "./templates/documento-pendente";
import { RelatorioSemanalEmail, RelatorioEmailProps } from "./templates/relatorio-semanal";
import * as React from 'react';

const FROM_EMAIL = "PontoCerto <noreply@pontocertoapp.xyz>";

export interface SendEmailResponse {
  success: boolean;
  error?: string;
}

export async function sendBoasVindas(to: string, dados: BemVindoEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Bem-vindo ao PontoCerto RH!",
      react: React.createElement(BemVindoEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][BOAS_VINDAS]:", error);
    return { success: false, error: error.message };
  }
}

export async function sendColaboradorCadastrado(to: string, dados: ColaboradorEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Novo Colaborador Cadastrado",
      react: React.createElement(ColaboradorCadastradoEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][NOVO_COLABORADOR]:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPenalidadeAplicada(to: string, dados: PenalidadeEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Notificação de Medida Disciplinar",
      react: React.createElement(PenalidadeAplicadaEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][PENALIDADE]:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPremiosConcedido(to: string, dados: PremioEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🎉 Parabéns pelo seu Reconhecimento!",
      react: React.createElement(PremioConcedidoEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][PREMIO]:", error);
    return { success: false, error: error.message };
  }
}

export async function sendDocumentoPendente(to: string, dados: DocumentoEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Ação Necessária: Assinatura de Documento",
      react: React.createElement(DocumentoPendenteEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][DOCUMENTO]:", error);
    return { success: false, error: error.message };
  }
}

export async function sendRelatorioSemanal(to: string, dados: RelatorioEmailProps): Promise<SendEmailResponse> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Relatório Semanal de Gestão - ${dados.unidade}`,
      react: React.createElement(RelatorioSemanalEmail, dados),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL_SEND_ERROR][RELATORIO]:", error);
    return { success: false, error: error.message };
  }
}

// Aliases para compatibilidade legada
export const sendWelcomeEmail = sendBoasVindas;
export const sendColaboradorEmail = sendColaboradorCadastrado;
export const sendPenalidadeNotification = sendPenalidadeAplicada;
export const sendPremioNotification = sendPremiosConcedido;
export const sendGestorReport = sendRelatorioSemanal;

// Mock para funções ainda não migradas
export async function sendPontoNotification(to: string, dados: any) {
  console.log("Mock: enviando notificação de ponto para", to);
  return { success: true };
}
export async function sendPasswordResetEmail(to: string, dados: any) {
  console.log("Mock: enviando reset de senha para", to);
  return { success: true };
}
