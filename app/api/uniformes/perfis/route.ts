import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const funcaoId = searchParams.get("funcaoId") || undefined;

  const perfis = await prisma.perfilUniforme.findMany({
    where: { ...(funcaoId && { funcaoId }) },
    include: { item: true, funcao: { include: { setor: true } } },
    orderBy: { item: { tipo: "asc" } },
  });

  return NextResponse.json(perfis);
}
