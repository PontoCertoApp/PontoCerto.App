import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;
  const status        = searchParams.get("status")        || undefined;
  const vencendoEm    = searchParams.get("vencendoEm");   // ex: "30" dias

  const now = new Date();
  const vencimentoLimite = vencendoEm ? addMonths(now, 0) : undefined;
  void vencimentoLimite;

  const exames = await prisma.exameColaborador.findMany({
    where: {
      ...(colaboradorId && { colaboradorId }),
      ...(status && { status }),
      ...(vencendoEm && {
        dataVencimento: { lte: new Date(now.getTime() + Number(vencendoEm) * 24 * 60 * 60 * 1000) },
      }),
    },
    include: {
      colaborador: { select: { nomeCompleto: true, cpf: true, loja: { select: { nome: true } } } },
      funcao: { select: { nome: true, exames: true } },
    },
    orderBy: { dataVencimento: "asc" },
  });

  return NextResponse.json(exames);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { colaboradorId, funcaoId, tipoExame, dataRealizacao, documentoUrl } = body;

  if (!colaboradorId || !funcaoId || !tipoExame || !dataRealizacao) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const realizacao = new Date(dataRealizacao);
  const dataVencimento = addMonths(realizacao, 12); // padrão 12 meses

  const exame = await prisma.exameColaborador.create({
    data: {
      colaboradorId,
      funcaoId,
      tipoExame,
      dataRealizacao: realizacao,
      dataVencimento,
      documentoUrl: documentoUrl ?? null,
      status: "VALIDO",
    },
    include: {
      colaborador: { select: { nomeCompleto: true } },
      funcao: { select: { nome: true } },
    },
  });

  return NextResponse.json(exame, { status: 201 });
}
