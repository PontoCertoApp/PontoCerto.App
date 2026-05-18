import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const userRole = session.user.role as string;

  // UPLOAD_OPERATOR pode apenas atualizar path e status → ENVIADO
  if (userRole === "UPLOAD_OPERATOR") {
    if (body.status && body.status !== "ENVIADO") {
      return NextResponse.json({ error: "Operador de upload só pode marcar documentos como ENVIADO" }, { status: 403 });
    }
  }

  const atualizado = await prisma.documento.update({
    where: { id },
    data: {
      ...(body.path   && { path: body.path }),
      ...(body.status && { status: body.status }),
      ...(body.observacao !== undefined && { observacao: body.observacao }),
      ...(body.status === "VALIDADO" && { validadoPorId: session.user.id }),
    },
    include: { colaborador: { select: { nomeCompleto: true } } },
  });

  return NextResponse.json(atualizado);
}
