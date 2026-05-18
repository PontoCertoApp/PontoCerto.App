import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cron: 0 8 * * *  (diário às 08h)
// Verifica entregas de uniforme com dataVencimento próxima (30 dias) e notifica gestores.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const agora    = new Date();
  const em30dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Entregas vencidas sem devolução (itens GRATUITOS)
  const entregasVencidas = await prisma.entregaUniforme.findMany({
    where: {
      tipo: "GRATUITO",
      dataVencimento: { lt: agora },
    },
    include: {
      colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } } } },
      item: { select: { nome: true, tipo: true } },
    },
  });

  // Filtra apenas as que não têm devolução
  const comDevolucoes = await prisma.devolucaoUniforme.findMany({
    where: { colaboradorId: { in: entregasVencidas.map((e) => e.colaboradorId) } },
    select: { colaboradorId: true, itemId: true },
  });
  const devolvidosSet = new Set(comDevolucoes.map((d) => `${d.colaboradorId}-${d.itemId}`));
  const pendentesDevoluicao = entregasVencidas.filter(
    (e) => !devolvidosSet.has(`${e.colaboradorId}-${e.itemId}`)
  );

  // Próximas trocas em 30 dias
  const proximasTrocas = await prisma.entregaUniforme.findMany({
    where: { dataVencimento: { gte: agora, lte: em30dias } },
    include: {
      colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } } } },
      item: { select: { nome: true } },
    },
  });

  console.log(`[CRON:vencimento-uniformes] Pendentes devolução: ${pendentesDevoluicao.length} | Próximas trocas: ${proximasTrocas.length}`);

  return NextResponse.json({
    ok: true,
    pendentesDevoluicao: pendentesDevoluicao.length,
    proximasTrocas: proximasTrocas.length,
  });
}
