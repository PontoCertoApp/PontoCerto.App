import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria") || undefined;

  const motivos = await prisma.motivoPreCadastrado.findMany({
    where: { ativo: true, ...(categoria && { categoria }) },
    orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
  });

  return NextResponse.json(motivos);
}
