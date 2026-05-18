import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cron: 0 8 * * *  (diário às 08h)
// Verifica exames vencendo em 30 dias ou já vencidos e atualiza status.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const agora    = new Date();
  const em30dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Marca exames vencidos
  const { count: vencidos } = await prisma.exameColaborador.updateMany({
    where: { dataVencimento: { lt: agora }, status: "VALIDO" },
    data: { status: "VENCIDO" },
  });

  // Busca exames vencendo em até 30 dias para notificação
  const vencendoEmBreve = await prisma.exameColaborador.findMany({
    where: {
      status: "VALIDO",
      dataVencimento: { gte: agora, lte: em30dias },
    },
    include: {
      colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } } } },
      funcao: { select: { nome: true } },
    },
  });

  console.log(`[CRON:vencimento-exames] Vencidos: ${vencidos} | Vencendo em 30 dias: ${vencendoEmBreve.length}`);

  return NextResponse.json({
    ok: true,
    vencidosAtualizados: vencidos,
    vencendoEmBreve: vencendoEmBreve.length,
    lista: vencendoEmBreve.map((e) => ({
      colaborador: e.colaborador.nomeCompleto,
      loja: e.colaborador.loja.nome,
      funcao: e.funcao.nome,
      tipoExame: e.tipoExame,
      dataVencimento: e.dataVencimento,
    })),
  });
}
