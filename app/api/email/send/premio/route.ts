import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendPremioNotification } from "@/lib/email/send";
import { checkRateLimit, getClientIp } from "@/lib/email/rate-limit";

const schema = z.object({
  to: z.string().email(),
  colaboradorNome: z.string().min(1),
  email: z.string().email(),
  tipoPremio: z.string().min(1),
  valor: z.number().positive(),
  mesReferencia: z.string().min(1),
  observacao: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["RH", "GERENTE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(`premio:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições." },
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
  const result = await sendPremioNotification(to, props);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, id: result.id },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
