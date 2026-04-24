"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PenalidadeStatus, PenalidadeTipo } from "@/lib/enums";
import { z } from "zod";
import { auth } from "@/auth";
import { sendPenalidadeAplicada } from "@/lib/email/send";

const penalidadeSchema = z.object({
  colaboradorId: z.string(),
  tipo: z.nativeEnum(PenalidadeTipo),
  motivo: z.string().min(5, "Descreva o motivo detalhadamente"),
  dataOcorrencia: z.date(),
});

export async function createPenalidade(data: z.infer<typeof penalidadeSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  try {
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: data.colaboradorId },
      select: { nomeCompleto: true, email: true },
    });

    const penalidade = await prisma.penalidade.create({
      data: {
        colaboradorId: data.colaboradorId,
        tipo: data.tipo,
        descricao: data.motivo,
        dataOcorrencia: data.dataOcorrencia,
        validadeAte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days validity
        geradoPorId: session.user.id,
        status: PenalidadeStatus.ATIVA,
      },
    });

    // Notify collaborator via email
    if (colaborador?.email) {
      sendPenalidadeAplicada(colaborador.email, {
        colaboradorNome: colaborador.nomeCompleto,
        tipoPenalidade: data.tipo,
        motivo: data.motivo,
        dataOcorrencia: data.dataOcorrencia.toLocaleDateString("pt-BR"),
        linkDocumento: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/colaboradores/${data.colaboradorId}`,
      }).catch((err) => console.error("[email/penalidade] Falha:", err));
    }

    revalidatePath("/penalidades");
    return { success: true, data: penalidade };
  } catch (error) {
    console.error("[CREATE_PENALIDADE_ERROR]:", error);
    return { success: false, error: "Erro ao registrar penalidade" };
  }
}

export async function getPenalidades() {
  return await prisma.penalidade.findMany({
    include: {
      colaborador: {
        include: {
          loja: true,
        },
      },
      geradoPor: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function checkPenalidadeProgression(colaboradorId: string) {
  const history = await prisma.penalidade.findMany({
    where: { 
      colaboradorId, 
      status: PenalidadeStatus.ATIVA,
      tipo: { in: [PenalidadeTipo.ADVERTENCIA, PenalidadeTipo.SUSPENSAO] }
    },
    orderBy: { createdAt: "desc" },
  });

  const countAdvertencia = history.filter(p => p.tipo === PenalidadeTipo.ADVERTENCIA).length;
  const countSuspensao = history.filter(p => p.tipo === PenalidadeTipo.SUSPENSAO).length;

  if (countSuspensao >= 1) return "Sugestão: Demissão por justa causa (Histórico crítico)";
  if (countAdvertencia >= 2) return "Sugestão: Suspensão (2 advertências ativas)";
  if (countAdvertencia === 1) return "Sugestão: Advertência (1 advertência ativa)";
  
  return "Sugestão: Advertência inicial";
}

export async function updatePenalidadeStatus(id: string, status: PenalidadeStatus) {
  await prisma.penalidade.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/penalidades");
}
