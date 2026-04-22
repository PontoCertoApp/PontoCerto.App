"use server";

import * as React from "react";
import { resend, FROM_ADDRESS, FROM_ADDRESS_SYSTEM } from "./resend";
import { WelcomeEmail } from "./templates/welcome";
import { PontoNotificationEmail } from "./templates/ponto-notification";
import { PenalidadeNotificationEmail } from "./templates/penalidade-notification";
import { PremioNotificationEmail } from "./templates/premio-notification";
import { PasswordResetEmail } from "./templates/password-reset";
import { GestorReportEmail } from "./templates/gestor-report";
import type {
  WelcomeEmailProps,
  PontoNotificationProps,
  PenalidadeNotificationProps,
  PremioNotificationProps,
  PasswordResetProps,
  GestorReportProps,
  EmailSendResult,
} from "./types";

function handleSendError(error: unknown): EmailSendResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[Email] Falha ao enviar:", message);
  return { success: false, error: message };
}

export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps
): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Bem-vindo(a) ao PontoCerto, ${props.colaboradorNome.split(" ")[0]}!`,
      react: React.createElement(WelcomeEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}

export async function sendPontoNotification(
  to: string,
  props: PontoNotificationProps
): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS_SYSTEM,
      to,
      subject: `[PontoCerto] Inconformidade de ponto registrada — ${props.data}`,
      react: React.createElement(PontoNotificationEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}

export async function sendPenalidadeNotification(
  to: string,
  props: PenalidadeNotificationProps
): Promise<EmailSendResult> {
  const TIPO_LABELS: Record<string, string> = {
    INCONSISTENCIA_PONTO: "Inconsistência de Ponto",
    QUEDA_CONDUTA: "Queda de Conduta",
    ADVERTENCIA: "Advertência Formal",
    SUSPENSAO: "Suspensão",
  };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS_SYSTEM,
      to,
      subject: `[PontoCerto] ${TIPO_LABELS[props.tipo] ?? props.tipo} registrada`,
      react: React.createElement(PenalidadeNotificationEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}

export async function sendPremioNotification(
  to: string,
  props: PremioNotificationProps
): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `[PontoCerto] Parabéns! Você recebeu um prêmio — ${props.tipoPremio}`,
      react: React.createElement(PremioNotificationEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  props: PasswordResetProps
): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS_SYSTEM,
      to,
      subject: "[PontoCerto] Redefinição de senha solicitada",
      react: React.createElement(PasswordResetEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}

export async function sendGestorReport(
  to: string,
  props: GestorReportProps
): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS_SYSTEM,
      to,
      subject: `[PontoCerto] Relatório Gerencial — ${props.loja} · ${props.periodo}`,
      react: React.createElement(GestorReportEmail, props),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return handleSendError(err);
  }
}
