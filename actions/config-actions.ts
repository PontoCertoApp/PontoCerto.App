"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/safe-action";

// --- LOJAS ---

export const lojaSchema = z.object({
  id: z.string().min(2, "ID muito curto").optional(),
  nome: z.string().min(3, "Nome muito curto"),
  cidade: z.string().min(2),
});

export const upsertLoja = createAction(
  lojaSchema,
  ["RH"],
  async (data, session) => {
    const loja = await prisma.loja.upsert({
      where: { id: data.id || "TEMP" },
      update: { nome: data.nome, cidade: data.cidade },
      create: { nome: data.nome, cidade: data.cidade },
    });
    revalidatePath("/config/lojas");
    return loja;
  }
);

// --- SETORES ---

export const setorSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3),
});

export const upsertSetor = createAction(
  setorSchema,
  ["RH"],
  async (data, session) => {
    const setor = await prisma.setor.upsert({
      where: { id: data.id || "TEMP" },
      update: { nome: data.nome },
      create: { nome: data.nome },
    });
    revalidatePath("/config/setores");
    return setor;
  }
);

// --- FUNCOES ---

export const funcaoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3),
  setorId: z.string(),
  salarioBase: z.number().min(0),
});

export const upsertFuncao = createAction(
  funcaoSchema,
  ["RH"],
  async (data, session) => {
    const funcao = await prisma.funcao.upsert({
      where: { id: data.id || "TEMP" },
      update: { 
        nome: data.nome, 
        setorId: data.setorId, 
        salarioBase: data.salarioBase 
      },
      create: { 
        nome: data.nome, 
        setorId: data.setorId, 
        salarioBase: data.salarioBase 
      },
    });
    revalidatePath("/config/funcoes");
    return funcao;
  }
);

// --- GETTERS ---

export async function getLojas() {
  return await prisma.loja.findMany({ orderBy: { nome: "asc" } });
}

export async function getSetores() {
  return await prisma.setor.findMany({ orderBy: { nome: "asc" } });
}

export async function getFuncoes() {
  return await prisma.funcao.findMany({ 
    include: { setor: true },
    orderBy: { nome: "asc" } 
  });
}
