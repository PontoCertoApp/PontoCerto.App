import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cron: 0 8 1 * *  (dia 1 de cada mês às 08h)
// Gera relatório de banco de horas para o mês anterior e notifica gestores.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  // Competência = mês anterior
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

  // Busca colaboradores com saldo de horas > 0 no mês anterior
  const registros = await prisma.bancoHoras.findMany({
    where: {
      competencia: mesAnterior,
      saldoHoras: { gt: 0 },
    },
    include: {
      colaborador: {
        select: {
          nomeCompleto: true,
          loja: { select: { nome: true } },
          funcao: { select: { nome: true } },
        },
      },
    },
    orderBy: [{ colaborador: { loja: { nome: "asc" } } }, { colaborador: { nomeCompleto: "asc" } }],
  });

  const competenciaStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;
  console.log(`[CRON:banco-horas-mensal] Competência ${competenciaStr}: ${registros.length} colaboradores com saldo`);

  return NextResponse.json({
    ok: true,
    competencia: competenciaStr,
    totalComSaldo: registros.length,
    colaboradores: registros.map((r) => ({
      nome: r.colaborador.nomeCompleto,
      loja: r.colaborador.loja.nome,
      funcao: r.colaborador.funcao.nome,
      horasAcumuladas: r.horasAcumuladas,
      horasCompensadas: r.horasCompensadas,
      saldoHoras: r.saldoHoras,
    })),
  });
}
