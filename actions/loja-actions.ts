"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const lojaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").optional(),
});

function requireAdmin(role?: string | null) {
  if ((role || "").toUpperCase() !== "ADMIN") throw new Error("Sem permissão");
}

export async function createLoja(data: z.infer<typeof lojaSchema>) {
  const session = await auth();
  try {
    requireAdmin(session?.user?.role);
    const loja = await prisma.loja.create({ data: { nome: data.nome, cidade: data.cidade } });
    revalidatePath("/config/lojas");
    return { success: true, data: loja };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Erro ao criar loja" };
  }
}

export async function getLojas() {
  const session = await auth();
  if (!session?.user) return [];
  try {
    return await prisma.loja.findMany({ orderBy: { nome: "asc" } });
  } catch (err: any) {
    console.error("ERRO EM getLojas:", err);
    return [];
  }
}

export async function deleteLoja(id: string) {
  const session = await auth();
  try {
    requireAdmin(session?.user?.role);
    await prisma.loja.delete({ where: { id } });
    revalidatePath("/config/lojas");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Erro ao excluir loja" };
  }
}

export async function updateLoja(id: string, data: z.infer<typeof lojaSchema>) {
  const session = await auth();
  try {
    requireAdmin(session?.user?.role);
    const loja = await prisma.loja.update({
      where: { id },
      data: { nome: data.nome, cidade: data.cidade },
    });
    revalidatePath("/config/lojas");
    return { success: true, data: loja };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Erro ao atualizar loja" };
  }
}
