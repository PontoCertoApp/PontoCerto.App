import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendPenalidadeNotification } from "@/lib/email/send";
import { checkRateLimit, getClientIp } from "@/lib/email/rate-limit";

const schema = z.object({
  to: z.string().email(),
  colaboradorNome: z.string().min(1),
  email: z.string().email(),
  tipo: z.enum([
    "INCONSISTENCIA_PONTO",
    "QUEDA_CONDUTA",
    "ADVERTENCIA",
    "SUSPENSAO",
  ]),
  descricao: z.string().min(1),
  dataOcorrencia: z.string().min(1),
  validadeAte: z.string().min(1),
  status: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["RH"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(`penalidade:${ip}`);
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
  const result = await sendPenalidadeNotification(to, props);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, id: result.id },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
