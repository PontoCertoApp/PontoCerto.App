import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as emailService from "@/lib/email/send";
import { z } from "zod";

const typeSchema = z.enum(["penalidade", "premio", "documento", "relatorio"]);

export async function POST(
  req: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { template } = params;
    const body = await req.json();

    let result;
    const to = body.to;

    switch (template) {
      case "penalidade":
        if (session.user.role !== "RH") return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
        result = await emailService.sendPenalidadeAplicada(to, body.dados);
        break;
      case "premio":
        if (session.user.role !== "RH") return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
        result = await emailService.sendPremiosConcedido(to, body.dados);
        break;
      case "documento":
        result = await emailService.sendDocumentoPendente(to, body.dados);
        break;
      case "relatorio":
        if (session.user.role !== "RH" && session.user.role !== "GERENTE") {
           return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
        }
        result = await emailService.sendRelatorioSemanal(to, body.dados);
        break;
      default:
        return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    if (result?.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result?.error || "Erro no envio" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
