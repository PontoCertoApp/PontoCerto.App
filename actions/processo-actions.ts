"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ColaboradorStatus } from "@/lib/enums";

export async function aprovarContratacao(id: string) {
  try {
    await prisma.colaborador.update({
      where: { id },
      data: { status: ColaboradorStatus.ATIVO },
    });
    revalidatePath("/colaboradores");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao aprovar contratação" };
  }
}

export async function iniciarDesligamento(id: string) {
  try {
    await prisma.colaborador.update({
      where: { id },
      data: { status: ColaboradorStatus.DESLIGADO },
    });
    revalidatePath("/colaboradores");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao iniciar desligamento" };
  }
}
