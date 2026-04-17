"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PenalidadeStatus, PenalidadeTipo } from "@/lib/enums";

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
  // Logic: Advertência -> Advertência -> Suspensão -> Demissão por justa causa
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

  if (countSuspensao >= 1) {
    return "Sugestão: Demissão por justa causa (Histórico crítico)";
  }
  if (countAdvertencia >= 2) {
    return "Sugestão: Suspensão (2 advertências ativas)";
  }
  if (countAdvertencia === 1) {
    return "Sugestão: Advertência (1 advertência ativa)";
  }
  
  return "Sugestão: Advertência inicial";
}

export async function updatePenalidadeStatus(id: string, status: PenalidadeStatus) {
  await prisma.penalidade.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/penalidades");
}
