"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PremioStatus } from "@/lib/enums";
import { auth } from "@/auth";
import { sendPremiosConcedido } from "@/lib/email/send";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

    const colaborador = await prisma.colaborador.findUnique({
      where: { id: data.colaboradorId },
      select: { nomeCompleto: true, email: true },
    });

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

    // Fire-and-forget email notification
    if (colaborador?.email) {
      sendPremiosConcedido(colaborador.email, {
        colaboradorNome: colaborador.nomeCompleto,
        nomePremio: data.tipo,
        valorOuDescricao: `R$ ${data.valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        mensagem: data.observacao || "Parabéns pelo seu desempenho!",
      }).catch((err) => console.error("[email/premio] Falha:", err));
    }

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

export async function getPremiosStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [premiosDoMes, totalAtivos] = await Promise.all([
    prisma.premio.findMany({
      where: {
        status: PremioStatus.ATIVO,
        dataReferencia: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { colaboradorId: true, valorFinal: true },
    }),
    prisma.colaborador.count({ where: { status: "ATIVO" } }),
  ]);

  const totalPremiado = premiosDoMes.reduce((sum, p) => sum + p.valorFinal, 0);
  const colaboradoresComPremio = new Set(premiosDoMes.map((p) => p.colaboradorId)).size;
  const pctComPremio = totalAtivos > 0
    ? Math.round((colaboradoresComPremio / totalAtivos) * 100)
    : 0;

  return { totalPremiado, pctComPremio };
}
