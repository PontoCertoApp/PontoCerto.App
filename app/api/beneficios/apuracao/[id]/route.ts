import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const apuracao = await prisma.apuracaoBeneficio.findUnique({
    where: { id },
    include: { colaborador: { include: { funcao: true, loja: true } } },
  });

  if (!apuracao) return NextResponse.json({ error: "Apuração não encontrada" }, { status: 404 });
  return NextResponse.json(apuracao);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const apuracao = await prisma.apuracaoBeneficio.findUnique({ where: { id } });
  if (!apuracao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  if (apuracao.statusApuracao === "FECHADA") {
    return NextResponse.json({ error: "Competência fechada — edição bloqueada" }, { status: 409 });
  }

  // Ação: fechar competência
  if (body.acao === "fechar") {
    const atualizado = await prisma.apuracaoBeneficio.update({
      where: { id },
      data: { statusApuracao: "FECHADA", fechadoEm: new Date() },
    });
    return NextResponse.json(atualizado);
  }

  // Ação: exportar
  if (body.acao === "exportar") {
    const atualizado = await prisma.apuracaoBeneficio.update({
      where: { id },
      data: { statusApuracao: "EXPORTADA" },
    });
    return NextResponse.json(atualizado);
  }

  // Edição normal de valores
  const atualizado = await prisma.apuracaoBeneficio.update({
    where: { id },
    data: {
      ...(body.valorPremio             !== undefined && { valorPremio: body.valorPremio }),
      ...(body.descontosVale           !== undefined && { descontosVale: body.descontosVale }),
      ...(body.descontosPontualidade   !== undefined && { descontosPontualidade: body.descontosPontualidade }),
    },
  });

  return NextResponse.json(atualizado);
}
