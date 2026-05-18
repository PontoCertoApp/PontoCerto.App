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
  const vaga = await prisma.vaga.findUnique({
    where: { id },
    include: { funcao: { include: { setor: true } }, loja: true },
  });

  if (!vaga) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  return NextResponse.json(vaga);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { quantidadeMaxima, quantidadeAtual, status, observacao, dataFechamento } = body;

  const vaga = await prisma.vaga.findUnique({ where: { id } });
  if (!vaga) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });

  // Bloquear preenchimento se já atingiu o máximo
  const novaQtd = quantidadeAtual ?? vaga.quantidadeAtual;
  const novoMax = quantidadeMaxima ?? vaga.quantidadeMaxima;
  const novoStatus = novaQtd >= novoMax ? "PREENCHIDA" : (status ?? vaga.status);

  const atualizado = await prisma.vaga.update({
    where: { id },
    data: {
      ...(quantidadeMaxima !== undefined && { quantidadeMaxima }),
      ...(quantidadeAtual !== undefined  && { quantidadeAtual: novaQtd }),
      status: novoStatus,
      ...(observacao !== undefined && { observacao }),
      ...(dataFechamento && { dataFechamento: new Date(dataFechamento) }),
    },
    include: { funcao: { include: { setor: true } }, loja: true },
  });

  return NextResponse.json(atualizado);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.vaga.update({ where: { id }, data: { status: "CANCELADA" } });
  return NextResponse.json({ ok: true });
}
