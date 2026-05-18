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
  const exame = await prisma.exameColaborador.findUnique({
    where: { id },
    include: { colaborador: true, funcao: true },
  });

  if (!exame) return NextResponse.json({ error: "Exame não encontrado" }, { status: 404 });
  return NextResponse.json(exame);
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

  const atualizado = await prisma.exameColaborador.update({
    where: { id },
    data: {
      ...(body.status       && { status: body.status }),
      ...(body.documentoUrl && { documentoUrl: body.documentoUrl }),
    },
    include: { colaborador: { select: { nomeCompleto: true } }, funcao: { select: { nome: true } } },
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
  await prisma.exameColaborador.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
