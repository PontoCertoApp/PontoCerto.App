import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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

  const registro = await prisma.bancoHoras.findUnique({ where: { id } });
  if (!registro) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const novaCompensadas = body.horasCompensadas ?? Number(registro.horasCompensadas);
  const novoSaldo = Number(registro.horasAcumuladas) - novaCompensadas;

  const atualizado = await prisma.bancoHoras.update({
    where: { id },
    data: {
      horasCompensadas: novaCompensadas,
      saldoHoras: novoSaldo,
      ...(body.observacao && { observacao: body.observacao }),
      registradoPorId: session.user.id,
    },
  });

  return NextResponse.json(atualizado);
}
