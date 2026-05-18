import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const colaboradorId = searchParams.get("colaboradorId") || undefined;
  const pendentes     = searchParams.get("pendentes") === "true"; // sem devolução

  const entregas = await prisma.entregaUniforme.findMany({
    where: { ...(colaboradorId && { colaboradorId }) },
    include: {
      item: true,
      colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } } } },
      gestor: { select: { name: true } },
    },
    orderBy: { dataEntrega: "desc" },
  });

  if (pendentes) {
    // Filtrar entregas sem devolução correspondente para itens GRATUITOS
    const devolucoesIds = await prisma.devolucaoUniforme.findMany({
      where: { ...(colaboradorId && { colaboradorId }) },
      select: { itemId: true, colaboradorId: true },
    });
    const devolvidosSet = new Set(devolucoesIds.map((d) => `${d.colaboradorId}-${d.itemId}`));
    const pendentes_arr = entregas.filter(
      (e) => e.tipo === "GRATUITO" && !devolvidosSet.has(`${e.colaboradorId}-${e.itemId}`)
    );
    return NextResponse.json(pendentes_arr);
  }

  return NextResponse.json(entregas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { colaboradorId, itemId, tipo, dataEntrega, valor, documentoUrl } = body;

  if (!colaboradorId || !itemId || !tipo || !dataEntrega) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  // Busca o perfil para calcular tempoTrocaMeses
  const colaborador = await prisma.colaborador.findUnique({ where: { id: colaboradorId }, select: { funcaoId: true } });
  if (!colaborador) return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });

  const perfil = await prisma.perfilUniforme.findFirst({
    where: { funcaoId: colaborador.funcaoId, itemId },
  });
  const meses = perfil?.tempoTrocaMeses ?? 12;

  const entrega = new Date(dataEntrega);
  const dataVencimento = addMonths(entrega, meses);

  const nova = await prisma.entregaUniforme.create({
    data: {
      colaboradorId,
      itemId,
      tipo,
      dataEntrega: entrega,
      dataVencimento,
      valor: valor ?? null,
      documentoUrl: documentoUrl ?? null,
      gestorId: session.user.id!,
      statusAssinatura: "PENDENTE",
    },
    include: { item: true, colaborador: { select: { nomeCompleto: true } } },
  });

  return NextResponse.json(nova, { status: 201 });
}
