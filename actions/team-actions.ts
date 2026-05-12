"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const timeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lojaId: z.string().min(1, "Selecione uma loja"),
});

function requireAdminOrHR(role?: string) {
  const r = (role || "").toUpperCase();
  if (r !== "ADMIN" && r !== "HR_STAFF") throw new Error("Sem permissão");
}

export async function createTime(data: z.infer<typeof timeSchema>) {
  const session = await auth();
  requireAdminOrHR(session?.user?.role);
  try {
    const time = await prisma.time.create({ data: { nome: data.nome, lojaId: data.lojaId } });
    revalidatePath("/config/times");
    return { success: true, data: time };
  } catch {
    return { success: false, error: "Erro ao criar time" };
  }
}

export async function getTimes(lojaId?: string) {
  const session = await auth();
  if (!session?.user) return [];

  const role = (session.user.role || "").toUpperCase();

  // STORE_MANAGER only sees times from their own store
  const effectiveLojaId =
    role === "STORE_MANAGER" ? (session.user.lojaId ?? lojaId) : lojaId;

  return prisma.time.findMany({
    where: {
      ativo: true,
      ...(effectiveLojaId ? { lojaId: effectiveLojaId } : {}),
    },
    include: { loja: true },
    orderBy: [{ loja: { nome: "asc" } }, { nome: "asc" }],
  });
}

export async function getTimesAll() {
  const session = await auth();
  if (!session?.user) return [];
  return prisma.time.findMany({
    include: { loja: true },
    orderBy: [{ loja: { nome: "asc" } }, { nome: "asc" }],
  });
}

export async function updateTime(id: string, data: z.infer<typeof timeSchema>) {
  const session = await auth();
  requireAdminOrHR(session?.user?.role);
  try {
    const time = await prisma.time.update({ where: { id }, data: { nome: data.nome, lojaId: data.lojaId } });
    revalidatePath("/config/times");
    return { success: true, data: time };
  } catch {
    return { success: false, error: "Erro ao atualizar time" };
  }
}

export async function toggleTimeAtivo(id: string) {
  const session = await auth();
  requireAdminOrHR(session?.user?.role);
  try {
    const current = await prisma.time.findUnique({ where: { id }, select: { ativo: true } });
    await prisma.time.update({ where: { id }, data: { ativo: !current?.ativo } });
    revalidatePath("/config/times");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao alterar status do time" };
  }
}

export async function toggleLojaAtivo(id: string) {
  const session = await auth();
  if ((session?.user?.role || "").toUpperCase() !== "ADMIN") throw new Error("Sem permissão");
  try {
    const current = await prisma.loja.findUnique({ where: { id }, select: { ativo: true } });
    await prisma.loja.update({ where: { id }, data: { ativo: !current?.ativo } });
    revalidatePath("/config/lojas");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao alterar status da loja" };
  }
}
