import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;
  const competencia   = searchParams.get("competencia")   || undefined; // YYYY-MM
  const lojaId        = searchParams.get("lojaId")        || undefined;

  let competenciaDate: Date | undefined;
  if (competencia) {
    const [ano, mes] = competencia.split("-").map(Number);
    competenciaDate = new Date(ano, mes - 1, 1);
  }

  const registros = await prisma.bancoHoras.findMany({
    where: {
      ...(colaboradorId && { colaboradorId }),
      ...(competenciaDate && { competencia: competenciaDate }),
      ...(lojaId && { colaborador: { lojaId } }),
    },
    include: {
      colaborador: {
        select: {
          nomeCompleto: true,
          funcao: { select: { nome: true } },
          loja: { select: { nome: true } },
        },
      },
    },
    orderBy: [{ competencia: "desc" }, { colaborador: { nomeCompleto: "asc" } }],
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { colaboradorId, competencia, horasAcumuladas, tipo, observacao } = body;

  if (!colaboradorId || !competencia || horasAcumuladas === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const [ano, mes] = competencia.split("-").map(Number);
  const competenciaDate = new Date(ano, mes - 1, 1);

  // Verifica se já existe registro para este colaborador+competência
  const existente = await prisma.bancoHoras.findFirst({
    where: { colaboradorId, competencia: competenciaDate },
  });

  if (existente) {
    // Atualiza compensação
    const compensadas = (existente.horasCompensadas as any).add ? existente.horasCompensadas : 0;
    const novaCompensadas = Number(compensadas) + Number(body.horasCompensadas ?? 0);
    const novoSaldo = Number(existente.horasAcumuladas) - novaCompensadas;

    const atualizado = await prisma.bancoHoras.update({
      where: { id: existente.id },
      data: {
        horasCompensadas: novaCompensadas,
        saldoHoras: novoSaldo,
        observacao: observacao ?? existente.observacao,
        registradoPorId: session.user.id,
      },
      include: { colaborador: { select: { nomeCompleto: true } } },
    });
    return NextResponse.json(atualizado);
  }

  const novo = await prisma.bancoHoras.create({
    data: {
      colaboradorId,
      competencia: competenciaDate,
      horasAcumuladas: horasAcumuladas,
      horasCompensadas: 0,
      saldoHoras: horasAcumuladas,
      tipo: tipo ?? "CREDITO",
      observacao: observacao ?? null,
      registradoPorId: session.user.id,
    },
    include: { colaborador: { select: { nomeCompleto: true } } },
  });

  return NextResponse.json(novo, { status: 201 });
}
