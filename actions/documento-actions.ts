"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DocumentStatus } from "@/lib/enums";
import { auth } from "@/auth";
import { sendDocumentoPendente } from "@/lib/email/send";
import { getScope, viaColaboradorScope } from "@/lib/scope";

export async function getDocumentosPendentes() {
  const scope = await getScope();
  if (!scope) return [];

  const filter = viaColaboradorScope(scope);

  return prisma.documento.findMany({
    where: { status: { in: [DocumentStatus.PENDENTE, DocumentStatus.ENVIADO] }, ...filter },
    include: { colaborador: { include: { loja: true, time: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllDocumentos() {
  const scope = await getScope();
  if (!scope) return [];

  const filter = viaColaboradorScope(scope);

  return prisma.documento.findMany({
    where: filter,
    include: { colaborador: { include: { loja: true, time: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function validarDocumento(id: string, status: DocumentStatus, observacao?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  await prisma.documento.update({ where: { id }, data: { status, observacao, validadoPorId: session.user.id } });
  revalidatePath("/documentos");
  return { success: true };
}

export async function getDocumentosPorColaborador(colaboradorId: string) {
  const session = await auth();
  if (!session?.user) return [];
  return prisma.documento.findMany({ where: { colaboradorId }, orderBy: { createdAt: "desc" } });
}

export async function notificarDocumentoPendente(documentoId: string, dataLimite: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  try {
    const doc = await prisma.documento.findUnique({ where: { id: documentoId }, include: { colaborador: true } });
    if (!doc || !doc.colaborador?.email) return { success: false, error: "Colaborador sem e-mail ou documento não encontrado" };

    await sendDocumentoPendente(doc.colaborador.email, {
      colaboradorNome: doc.colaborador.nomeCompleto,
      nomeDocumento: doc.nome,
      dataLimite,
      linkAssinatura: `${process.env.NEXT_PUBLIC_APP_URL || "https://pontocertoapp-pontocertoapp.xyzjfn.easypanel.host"}/colaboradores/${doc.colaboradorId}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
