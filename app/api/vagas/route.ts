import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lojaId   = searchParams.get("lojaId")   || undefined;
  const funcaoId = searchParams.get("funcaoId")  || undefined;
  const status   = searchParams.get("status")    || undefined;

  const vagas = await prisma.vaga.findMany({
    where: { ...(lojaId && { lojaId }), ...(funcaoId && { funcaoId }), ...(status && { status }) },
    include: { funcao: { include: { setor: true } }, loja: true },
    orderBy: { dataAbertura: "desc" },
  });

  return NextResponse.json(vagas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { funcaoId, lojaId, quantidadeMaxima, observacao } = body;

  if (!funcaoId || !lojaId || !quantidadeMaxima) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const vaga = await prisma.vaga.create({
    data: { funcaoId, lojaId, quantidadeMaxima, quantidadeAtual: 0, status: "ABERTA", observacao },
    include: { funcao: { include: { setor: true } }, loja: true },
  });

  return NextResponse.json(vaga, { status: 201 });
}
