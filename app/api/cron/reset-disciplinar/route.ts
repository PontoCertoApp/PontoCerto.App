import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cron: 0 0 25 * *  (executa todo dia 25 à meia-noite)
// Inicia um novo período de apuração disciplinar.
// SUSPENSÕES não são resetadas — apenas o contador do período muda.
// O reset é lógico: ao contar penalidades, filtramos por createdAt >= início do período.
// Este endpoint atualiza o campo ultimoResetEm na ConfiguracaoProgressao
// e pode enviar notificações ao RH.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const hoje = new Date();

  // Atualiza o registro de último reset
  await prisma.configuracaoProgressao.updateMany({
    where: { ativa: true },
    data: { ultimoResetEm: hoje },
  });

  // Log do reset
  console.log(`[CRON:reset-disciplinar] Reset executado em ${hoje.toISOString()}`);

  // Conta colaboradores ativos para relatório
  const totalColabs = await prisma.colaborador.count({
    where: { status: { in: ["ATIVO", "EM_EXPERIENCIA"] } },
  });

  return NextResponse.json({
    ok: true,
    resetEm: hoje.toISOString(),
    totalColaboradoresAfetados: totalColabs,
    mensagem: "Período disciplinar reiniciado. Suspensões mantidas — cumprem regra própria.",
  });
}
