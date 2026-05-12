"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const setorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export async function createSetor(data: z.infer<typeof setorSchema>) {
  try {
    const setor = await prisma.setor.create({
      data: {
        nome: data.nome,
      },
    });
    revalidatePath("/config/setores");
    return { success: true, data: setor };
  } catch (error) {
    console.error("ERRO EM createSetor:", error);
    return { success: false, error: "Erro ao criar setor" };
  }
}

export async function getSetores() {
  const session = await auth();
  if (!session?.user) return [];
  try {
    return await prisma.setor.findMany({
      orderBy: { nome: "asc" },
    });
  } catch (error: any) {
    console.error("ERRO EM getSetores:", error);
    return [];
  }
}

export async function deleteSetor(id: string) {
  try {
    await prisma.setor.delete({ where: { id } });
    revalidatePath("/config/setores");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir setor" };
  }
}

export async function updateSetor(id: string, data: z.infer<typeof setorSchema>) {
  try {
    const setor = await prisma.setor.update({
      where: { id },
      data: {
        nome: data.nome,
      },
    });
    revalidatePath("/config/setores");
    return { success: true, data: setor };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar setor" };
  }
}
