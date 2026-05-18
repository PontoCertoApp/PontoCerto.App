import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;

  const devolucoes = await prisma.devolucaoUniforme.findMany({
    where: { ...(colaboradorId && { colaboradorId }) },
    include: {
      item: true,
      colaborador: { select: { nomeCompleto: true } },
    },
    orderBy: { dataDevoluicao: "desc" },
  });

  return NextResponse.json(devolucoes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { colaboradorId, itemId, dataDevoluicao, statusConservacao, documentoUrl, observacao, fotoUrl } = body;

  if (!colaboradorId || !itemId || !dataDevoluicao) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const devolucao = await prisma.devolucaoUniforme.create({
    data: {
      colaboradorId,
      itemId,
      dataDevoluicao: new Date(dataDevoluicao),
      statusConservacao: statusConservacao ?? null,
      documentoUrl: documentoUrl ?? null,
      observacao: observacao ?? null,
      fotoUrl: fotoUrl ?? null,
    },
    include: { item: true, colaborador: { select: { nomeCompleto: true } } },
  });

  return NextResponse.json(devolucao, { status: 201 });
}
