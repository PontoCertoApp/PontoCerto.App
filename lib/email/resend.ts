"use server";

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY não configurada.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = "PontoCerto <noreply@pontoce.rto>";
export const FROM_ADDRESS_SYSTEM = "PontoCerto Sistema <sistema@pontoce.rto>";
export const REPLY_TO = "suporte@pontoce.rto";
