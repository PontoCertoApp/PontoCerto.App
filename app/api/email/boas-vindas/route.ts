import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendBoasVindas } from "@/lib/email/send";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  nomeUsuario: z.string(),
  empresa: z.string(),
  loginUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "RH") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = schema.parse(body);

    const result = await sendBoasVindas(validatedData.to, {
      nomeUsuario: validatedData.nomeUsuario,
      empresa: validatedData.empresa,
      loginUrl: validatedData.loginUrl,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
