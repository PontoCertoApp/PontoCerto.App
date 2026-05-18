import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;
  const status        = searchParams.get("status")        || undefined;
  const userRole      = session.user.role as string;
  const userLojaId    = session.user.lojaId as string | null;

  // UPLOAD_OPERATOR vê apenas documentos PENDENTES
  const statusFiltro =
    userRole === "UPLOAD_OPERATOR" ? "PENDENTE" : (status ?? undefined);

  // STORE_MANAGER vê apenas docs da sua loja
  const lojaFiltro = userRole === "STORE_MANAGER" ? (userLojaId ?? undefined) : undefined;

  const documentos = await prisma.documento.findMany({
    where: {
      ...(colaboradorId && { colaboradorId }),
      ...(statusFiltro  && { status: statusFiltro }),
      ...(lojaFiltro    && { colaborador: { lojaId: lojaFiltro } }),
    },
    include: {
      colaborador: {
        select: { nomeCompleto: true, loja: { select: { nome: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documentos);
}
