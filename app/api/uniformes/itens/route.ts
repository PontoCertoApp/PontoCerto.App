import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const itens = await prisma.itemUniforme.findMany({
    where: { ativo: true },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(itens);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { nome, tipo, valor } = body;
  if (!nome || !tipo) return NextResponse.json({ error: "nome e tipo são obrigatórios" }, { status: 400 });

  const item = await prisma.itemUniforme.create({ data: { nome, tipo, valor: valor ?? null } });
  return NextResponse.json(item, { status: 201 });
}
