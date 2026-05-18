import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const config = await prisma.configuracaoProgressao.findFirst({ where: { ativa: true } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas ADMIN pode alterar a configuração de progressão" }, { status: 403 });
  }

  const body = await req.json();
  const config = await prisma.configuracaoProgressao.findFirst({ where: { ativa: true } });

  if (!config) {
    const novo = await prisma.configuracaoProgressao.create({ data: { ...body, ativa: true } });
    return NextResponse.json(novo, { status: 201 });
  }

  const atualizado = await prisma.configuracaoProgressao.update({
    where: { id: config.id },
    data: body,
  });

  return NextResponse.json(atualizado);
}
