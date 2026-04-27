"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/safe-action";
import { ColaboradorStatus } from "@/lib/enums";
import { sendBoasVindas, sendColaboradorCadastrado } from "@/lib/email/send";
import { auth } from "@/auth";

const colaboradorSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  rg: z.string().min(5),
  dataNascimento: z.string(),
  telefonePrincipal: z.string(),
  telefoneSecundario: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contaBancoBrasil: z.string(),
  possuiFilhosMenores14: z.boolean(),
  funcaoNome: z.string().min(1, "Obrigatório"),
  setorNome: z.string().min(1, "Obrigatório"),
  lojaId: z.string().optional(),

  // Form-only fields: used to compose contaBancoBrasil, stripped before Prisma
  agenciaBB: z.string().optional(),
  contaBB: z.string().optional(),

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
  ["RH", "GERENTE"],
  async (data, session) => {
    console.log("[CREATE_COLABORADOR] Iniciando processo para:", data.nomeCompleto);
    try {
      const sessionLojaId = session?.user?.lojaId;
      
      // Prioridade: lojaId vindo do form (especialmente para RH)
      // Se não vier no form, tenta pegar da sessão (para Gerente)
      const targetLojaId = data.lojaId || sessionLojaId;

      if (!targetLojaId) {
        console.error("[CREATE_COLABORADOR] Erro: Nenhuma loja vinculada.");
        throw new Error("É necessário selecionar uma loja para cadastrar o colaborador.");
      }

      // Check for existing CPF or Email
      const existing = await prisma.colaborador.findFirst({
        where: {
          OR: [
            { cpf: data.cpf },
            ...(data.email && data.email !== "" ? [{ email: data.email }] : [])
          ]
        }
      });

      if (existing) {
        throw new Error(existing.cpf === data.cpf ? "CPF já cadastrado." : "E-mail já cadastrado.");
      }

      const result = await prisma.$transaction(async (tx) => {
        let setor = await tx.setor.findFirst({ where: { nome: data.setorNome } });
        if (!setor) setor = await tx.setor.create({ data: { nome: data.setorNome } });

        let funcao = await tx.funcao.findFirst({ where: { nome: data.funcaoNome, setorId: setor.id } });
        if (!funcao) {
          funcao = await tx.funcao.create({
            data: { nome: data.funcaoNome, setorId: setor.id, salarioBase: 0 }
          });
        }

        const { setorNome: _s, funcaoNome: _f, lojaId: _l, agenciaBB: _ag, contaBB: _cb, ...rest } = data;

        const colaborador = await tx.colaborador.create({
          data: {
            ...rest,
            lojaId: targetLojaId,
            setorId: setor.id,
            funcaoId: funcao.id,
            dataNascimento: new Date(data.dataNascimento),
            email: data.email || null,
            status: ColaboradorStatus.EM_EXPERIENCIA,
          },
        });

        const docsToCreate = [
          { nome: "Comprovante de Endereço", path: data.enderecoComprovantePath },
          { nome: "Foto do PIS", path: data.pisFotoPath },
          { nome: "Histórico Escolar", path: data.historicoEscolarPath },
          { nome: "CTPS Digital", path: data.ctpsDigitalPath },
          { nome: "Certidão de Nascimento (Filhos)", path: data.certidaoFilhosPath },
          { nome: "Foto de Perfil", path: data.fotoPerfilPath },
          { nome: "Contrato Assinado", path: data.contratoAssinadoPath },
        ].filter(d => d.path);

        if (docsToCreate.length > 0) {
          await tx.documento.createMany({
            data: docsToCreate.map(d => ({
              colaboradorId: colaborador.id,
              nome: d.nome,
              path: d.path!,
              status: "PENDENTE"
            }))
          });
        }

        return { colaborador, funcao, setor };
      });

      const { colaborador } = result;

      if (colaborador.email) {
        const loja = await prisma.loja.findUnique({ where: { id: targetLojaId }, select: { nome: true } });
        sendBoasVindas(colaborador.email, {
          nomeUsuario: colaborador.nomeCompleto,
          empresa: loja?.nome ?? "PontoCerto",
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
        }).catch(() => {});
      }

      revalidatePath("/colaboradores");
      return colaborador;
    } catch (error: any) {
      console.error("[CREATE_COLABORADOR_ERROR]:", error);
      throw error;
    }
  }
);

/**
 * Senior Refactor: Advanced Search & Pagination
 */
export async function getColaboradoresPaged({
  query = "",
  status,
  lojaId: filterLojaId,
  page = 1,
  limit = 10,
}: {
  query?: string;
  status?: ColaboradorStatus;
  lojaId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) return { items: [], metadata: { total: 0, page: 1, limit: 10, totalPages: 0 } };

  const isRH = session.user.role === "RH";
  const userLojaId = session.user.lojaId;

  // Se for Gerente, obrigatoriamente filtra pela loja dele
  // Se for RH, filtra pela loja passada no argumento ou vê tudo
  const targetLojaId = isRH ? filterLojaId : userLojaId;

  const skip = (page - 1) * limit;
  const where: any = {
    AND: [
      query ? { OR: [{ nomeCompleto: { contains: query, mode: 'insensitive' } }, { cpf: { contains: query, mode: 'insensitive' } }] } : {},
      status ? { status } : {},
      targetLojaId ? { lojaId: targetLojaId } : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.colaborador.count({ where }),
    prisma.colaborador.findMany({
      where,
      include: { funcao: true, loja: true, setor: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return { items, metadata: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getColaboradores() {
  const session = await auth();
  if (!session?.user) return [];
  
  const role = session.user.role?.toUpperCase();
  const isRH = role === "RH" || role === "ADMIN";
  // Guard: only filter by lojaId if it's actually set.
  // A null/undefined lojaId would generate WHERE lojaId IS NULL in PostgreSQL
  // returning zero rows instead of all rows.
  const lojaId = session.user.lojaId;
  const where = isRH ? {} : (lojaId ? { lojaId } : {});

  return await prisma.colaborador.findMany({
    where,
    include: { funcao: true, loja: true, setor: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Dedicated action for the Ponto Manual modal.
 * Uses SELECT instead of INCLUDE to avoid failures on orphaned FK relations.
 * No role-based filtering — returns all collaborators for RH use.
 */
export async function getColaboradoresParaPonto(search?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("[PONTO_COLABS] Sem sessão ativa.");
      return { success: false, data: [], error: "Sem sessão" };
    }

    const where: any = {};

    if (search && search.trim().length > 0) {
      where.nomeCompleto = { contains: search.trim(), mode: "insensitive" };
    }

    const data = await prisma.colaborador.findMany({
      where,
      select: {
        id: true,
        nomeCompleto: true,
        loja: { select: { nome: true } },
        funcao: { select: { nome: true } },
      },
      orderBy: { nomeCompleto: "asc" },
      take: 50,
    });

    console.log(`[PONTO_COLABS] Retornando ${data.length} colaboradores.`);
    return { success: true, data };
  } catch (error: any) {
    console.error("[PONTO_COLABS_ERROR]:", error?.message || error);
    return { success: false, data: [], error: error?.message || "Erro ao buscar colaboradores" };
  }
}

export async function getColaboradorById(id: string) {
  return await prisma.colaborador.findUnique({
    where: { id },
    include: {
      funcao: true,
      loja: true,
      setor: true,
      documentos: true,
    },
  });
}

export const deleteColaborador = createAction(
  z.string(),
  ["RH"],
  async (id) => {
    try {
      await prisma.$transaction([
        prisma.documento.deleteMany({ where: { colaboradorId: id } }),
        prisma.penalidade.deleteMany({ where: { colaboradorId: id } }),
        prisma.premio.deleteMany({ where: { colaboradorId: id } }),
        prisma.controleUniforme.deleteMany({ where: { colaboradorId: id } }),
        prisma.registroPonto.deleteMany({ where: { colaboradorId: id } }),
        prisma.user.deleteMany({ where: { colaboradorId: id } }),
        prisma.colaborador.delete({ where: { id } }),
      ]);
      
      revalidatePath("/colaboradores");
      return { success: true };
    } catch (error) {
      console.error("[DELETE_COLABORADOR_ERROR]:", error);
      throw new Error("Falha ao excluir colaborador.");
    }
  }
);
