"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DocumentStatus } from "@prisma/client";
import { auth } from "@/auth";

export async function getDocumentosPendentes() {
  return await prisma.documento.findMany({
    where: { 
      status: { in: [DocumentStatus.PENDENTE, DocumentStatus.ENVIADO] } 
    },
    include: {
      colaborador: {
        include: { loja: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function validarDocumento(id: string, status: DocumentStatus, observacao?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  await prisma.documento.update({
    where: { id },
    data: {
      status,
      observacao,
      validadoPorId: session.user.id,
    },
  });

  revalidatePath("/documentos");
  return { success: true };
}

export async function getDocumentosPorColaborador(colaboradorId: string) {
  return await prisma.documento.findMany({
    where: { colaboradorId },
    orderBy: { createdAt: "desc" },
  });
}
