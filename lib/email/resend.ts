import { Resend } from "resend";

export const FROM_ADDRESS = "PontoCerto <noreply@pontoce.rto>";
export const FROM_ADDRESS_SYSTEM = "PontoCerto Sistema <sistema@pontoce.rto>";
export const REPLY_TO = "suporte@pontoce.rto";

let _client: Resend | null = null;

/**
 * Returns the Resend client, initializing it on first call.
 * Throws at runtime (not at build time) if RESEND_API_KEY is missing.
 */
export function getResend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY não configurada.");
    _client = new Resend(key);
  }
  return _client;
}
