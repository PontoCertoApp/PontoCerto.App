"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const funcaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  setorId: z.string().min(1, "Selecione um setor"),
  salarioBase: z.number().min(0, "Salário deve ser positivo"),
});

export async function createFuncao(data: z.infer<typeof funcaoSchema>) {
  try {
    const funcao = await prisma.funcao.create({
      data: {
        nome: data.nome,
        setorId: data.setorId,
        salarioBase: data.salarioBase,
      },
    });
    revalidatePath("/config/funcoes");
    return { success: true, data: funcao };
  } catch (error) {
    return { success: false, error: "Erro ao criar função" };
  }
}

export async function getFuncoes() {
  return await prisma.funcao.findMany({
    include: { setor: true },
    orderBy: { nome: "asc" },
  });
}

export async function deleteFuncao(id: string) {
  try {
    await prisma.funcao.delete({ where: { id } });
    revalidatePath("/config/funcoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir função" };
  }
}

export async function updateFuncao(id: string, data: z.infer<typeof funcaoSchema>) {
  try {
    const funcao = await prisma.funcao.update({
      where: { id },
      data: {
        nome: data.nome,
        setorId: data.setorId,
        salarioBase: data.salarioBase,
      },
    });
    revalidatePath("/config/funcoes");
    return { success: true, data: funcao };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar função" };
  }
}
