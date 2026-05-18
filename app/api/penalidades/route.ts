import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;
  const tipo          = searchParams.get("tipo")          || undefined;
  const status        = searchParams.get("status")        || undefined;
  const lojaId        = searchParams.get("lojaId")        || undefined;
  const page          = Number(searchParams.get("page"))  || 1;
  const limit         = Number(searchParams.get("limit")) || 50;

  const userRole = session.user.role as string;
  const userLojaId = session.user.lojaId as string | null;

  // STORE_MANAGER só vê penalidades da sua loja
  const lojaFiltro =
    userRole === "STORE_MANAGER" ? (userLojaId ?? undefined) : (lojaId ?? undefined);

  const where = {
    ...(colaboradorId && { colaboradorId }),
    ...(tipo          && { tipo }),
    ...(status        && { status }),
    ...(lojaFiltro    && { colaborador: { lojaId: lojaFiltro } }),
  };

  const [total, items] = await prisma.$transaction([
    prisma.penalidade.count({ where }),
    prisma.penalidade.findMany({
      where,
      include: {
        colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } } } },
        motivoPreCadastrado: { select: { texto: true } },
        geradoPor: { select: { name: true } },
      },
      orderBy: { dataOcorrencia: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}
