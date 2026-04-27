"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const lojaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").optional(),
});

export async function createLoja(data: z.infer<typeof lojaSchema>) {
  try {
    const loja = await prisma.loja.create({
      data: {
        nome: data.nome,
        cidade: data.cidade,
      },
    });
    revalidatePath("/config/lojas");
    return { success: true, data: loja };
  } catch (error) {
    return { success: false, error: "Erro ao criar loja" };
  }
}

export async function getLojas() {
  return await prisma.loja.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function deleteLoja(id: string) {
  try {
    await prisma.loja.delete({ where: { id } });
    revalidatePath("/config/lojas");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir loja" };
  }
}

export async function updateLoja(id: string, data: z.infer<typeof lojaSchema>) {
  try {
    const loja = await prisma.loja.update({
      where: { id },
      data: {
        nome: data.nome,
        cidade: data.cidade,
      },
    });
    revalidatePath("/config/lojas");
    return { success: true, data: loja };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar loja" };
  }
}
