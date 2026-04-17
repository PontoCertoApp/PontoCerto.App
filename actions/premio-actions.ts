"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PremioStatus } from "@/lib/enums";
import { auth } from "@/auth";

const premioSchema = z.object({
  colaboradorId: z.string(),
  tipo: z.string(),
  valorOriginal: z.number(),
  valorFinal: z.number(),
  dataReferencia: z.date(),
  validadeAte: z.date().optional(),
  observacao: z.string().optional(),
});

export async function createPremio(data: z.infer<typeof premioSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  try {
    // Check "Respeito" rule: Max 3 active prizes
    const activePrizesCount = await prisma.premio.count({
      where: {
        colaboradorId: data.colaboradorId,
        status: PremioStatus.ATIVO,
      },
    });

    if (activePrizesCount >= 3) {
      return { success: false, error: "Regra Respeito: Colaborador já possui 3 prêmios ativos simultâneos." };
    }

    const premio = await prisma.premio.create({
      data: {
        colaboradorId: data.colaboradorId,
        tipo: data.tipo,
        valorOriginal: data.valorOriginal,
        valorFinal: data.valorFinal,
        dataReferencia: data.dataReferencia,
        validadeAte: data.validadeAte,
        observacao: data.observacao,
        editadoPorId: session.user.id,
      },
    });

    revalidatePath("/premios");
    return { success: true, data: premio };
  } catch (error) {
    return { success: false, error: "Erro ao criar prêmio" };
  }
}

export async function getPremios(status?: PremioStatus) {
  return await prisma.premio.findMany({
    where: status ? { status } : {},
    include: {
      colaborador: {
        include: { loja: true, funcao: true },
      },
      editadoPor: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePremioStatus(id: string, status: PremioStatus) {
  await prisma.premio.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/premios");
}
