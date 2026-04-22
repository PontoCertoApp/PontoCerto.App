import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp } from "@/lib/email/rate-limit";

const schema = z.object({
  to: z.string().email(),
  colaboradorNome: z.string().min(1),
  email: z.string().email(),
  resetUrl: z.string().url(),
  expiresIn: z.string().min(1),
});

// Public route — no auth required (user can't be logged in if they forgot password)
// Protected only by rate limit to prevent email enumeration
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(`password-reset:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas solicitações de redefinição. Aguarde alguns minutos." },
      { status: 429, headers: { "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { to, ...props } = parsed.data;
  const result = await sendPasswordResetEmail(to, props);

  // Always return 200 to prevent email enumeration attacks
  if (!result.success) {
    console.error("[password-reset] Falha ao enviar:", result.error);
  }

  return NextResponse.json(
    { success: true },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
