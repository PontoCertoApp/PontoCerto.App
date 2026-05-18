import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cron: 0 8 * * 1  (toda segunda-feira às 08h)
// Notifica gestores sobre vagas abertas há mais de 7 dias.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ALERTA_DIAS = 7;
  const limiteData = new Date(Date.now() - ALERTA_DIAS * 24 * 60 * 60 * 1000);

  const vagasAbertas = await prisma.vaga.findMany({
    where: {
      status: "ABERTA",
      dataAbertura: { lte: limiteData },
    },
    include: {
      funcao: { select: { nome: true, setor: { select: { nome: true } } } },
      loja: { select: { nome: true } },
    },
    orderBy: { dataAbertura: "asc" },
  });

  const diasAberto = (data: Date) =>
    Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`[CRON:vagas-abertas] ${vagasAbertas.length} vagas abertas há mais de ${ALERTA_DIAS} dias`);

  return NextResponse.json({
    ok: true,
    totalVagasAbertas: vagasAbertas.length,
    vagas: vagasAbertas.map((v) => ({
      id: v.id,
      funcao: v.funcao.nome,
      setor: v.funcao.setor.nome,
      loja: v.loja.nome,
      diasAberta: diasAberto(v.dataAbertura),
      quantidadeAberta: v.quantidadeMaxima - v.quantidadeAtual,
    })),
  });
}
