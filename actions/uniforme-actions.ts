"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getEstoqueUniforme(lojaId?: string) {
  return await prisma.estoqueUniforme.findMany({
    where: lojaId ? { lojaId } : {},
    include: { loja: true },
  });
}

export async function registrarEntregaUniforme(data: {
  colaboradorId: string;
  item: string;
  tamanho: string;
}) {
  try {
    const dataTroca = new Date();
    dataTroca.setMonth(dataTroca.getMonth() + 6); // Default 6 months

    await prisma.controleUniforme.create({
      data: {
        colaboradorId: data.colaboradorId,
        item: data.item,
        tamanho: data.tamanho,
        dataRecebimento: new Date(),
        dataTrocaPrevista: dataTroca,
      },
    });

    revalidatePath("/uniformes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao registrar entrega" };
  }
}

export async function getHistoricoUniformes(colaboradorId?: string) {
  return await prisma.controleUniforme.findMany({
    where: colaboradorId ? { colaboradorId } : {},
    include: {
      colaborador: {
        include: { loja: true },
      },
    },
    orderBy: { dataRecebimento: "desc" },
  });
}
