"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getScope, colaboradorScope } from "@/lib/scope";

export async function getEstoqueUniforme(lojaId?: string) {
  const session = await auth();
  if (!session?.user) return [];

  const role = (session.user.role || "").toUpperCase();
  // STORE_MANAGER can only see their own store's stock
  const effectiveLojaId =
    role === "ADMIN" || role === "HR_STAFF" ? lojaId : (session.user.lojaId ?? undefined);

  return prisma.estoqueUniforme.findMany({
    where: effectiveLojaId ? { lojaId: effectiveLojaId } : {},
    include: { loja: true },
  });
}

export async function registrarEntregaUniforme(data: {
  colaboradorId: string;
  item: string;
  tamanho: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  try {
    const dataTroca = new Date();
    dataTroca.setMonth(dataTroca.getMonth() + 6);

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
  } catch {
    return { success: false, error: "Erro ao registrar entrega" };
  }
}

export async function getHistoricoUniformes(colaboradorId?: string) {
  const scope = await getScope();
  if (!scope) return [];

  const scopeFilter = colaboradorScope(scope);
  const hasScopeFilter = Object.keys(scopeFilter).length > 0;

  return prisma.controleUniforme.findMany({
    where: {
      ...(colaboradorId ? { colaboradorId } : {}),
      ...(hasScopeFilter ? { colaborador: scopeFilter } : {}),
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataRecebimento: "desc" },
  });
}
