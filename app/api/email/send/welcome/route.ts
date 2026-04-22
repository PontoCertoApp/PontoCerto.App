import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendWelcomeEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp } from "@/lib/email/rate-limit";

const schema = z.object({
  to: z.string().email("Endereço de e-mail inválido"),
  colaboradorNome: z.string().min(3),
  cargo: z.string().min(1),
  loja: z.string().min(1),
  dataAdmissao: z.string().min(1),
  loginUrl: z.string().url("URL de login inválida"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["RH"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(`welcome:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { to, ...props } = parsed.data;
  const result = await sendWelcomeEmail(to, props);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, id: result.id },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
