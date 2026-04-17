"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/safe-action";
import { ColaboradorStatus } from "@/lib/enums";

export const colaboradorSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  rg: z.string().min(5),
  dataNascimento: z.string(),
  telefonePrincipal: z.string(),
  telefoneSecundario: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contaBancoBrasil: z.string(),
  possuiFilhosMenores14: z.boolean(),
  funcaoId: z.string(),
  setorId: z.string(),
  lojaId: z.string(),
  
  enderecoComprovantePath: z.string().optional(),
  pisFotoPath: z.string().optional(),
  historicoEscolarPath: z.string().optional(),
  ctpsDigitalPath: z.string().optional(),
  certidaoFilhosPath: z.string().optional(),
  fotoPerfilPath: z.string().optional(),
  contratoAssinadoPath: z.string().optional(),
});

/**
 * Senior Refactor: Standardized Action
 */
export const createColaborador = createAction(
  colaboradorSchema,
  ["RH"], // Only RH can create
  async (data) => {
    const colaborador = await prisma.colaborador.create({
      data: {
        ...data,
        dataNascimento: new Date(data.dataNascimento),
        email: data.email || null,
        status: ColaboradorStatus.EM_EXPERIENCIA,
      },
    });

    revalidatePath("/colaboradores");
    return colaborador;
  }
);

/**
 * Senior Refactor: Advanced Search & Pagination
 */
export async function getColaboradoresPaged({
  query = "",
  status,
  lojaId,
  page = 1,
  limit = 10,
}: {
  query?: string;
  status?: ColaboradorStatus;
  lojaId?: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const where: any = {
    AND: [
      query
        ? {
            OR: [
              { nomeCompleto: { contains: query } },
              { cpf: { contains: query } },
            ],
          }
        : {},
      status ? { status } : {},
      lojaId ? { lojaId } : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.colaborador.count({ where }),
    prisma.colaborador.findMany({
      where,
      include: {
        funcao: true,
        loja: true,
        setor: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Legacy helper for simple lists
export async function getColaboradores() {
  return await prisma.colaborador.findMany({
    include: { funcao: true, loja: true, setor: true },
    orderBy: { createdAt: "desc" },
  });
}
