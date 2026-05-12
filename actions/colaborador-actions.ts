"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/safe-action";
import { ColaboradorStatus } from "@/lib/enums";
import { sendBoasVindas } from "@/lib/email/send";
import { auth } from "@/auth";

const colaboradorSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  rg: z.string().min(5),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  telefonePrincipal: z.string(),
  telefoneSecundario: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contaBancoBrasil: z.string(),
  possuiFilhosMenores14: z.boolean(),
  funcaoNome: z.string().min(1, "Obrigatório"),
  setorNome: z.string().min(1, "Obrigatório"),
  lojaId: z.string().optional(),

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

function normalizeRole(role: string | undefined | null): string {
  if (!role) return "";
  const upper = role.toUpperCase();
  if (upper === "RH") return "HR_STAFF";
  if (upper === "GERENTE") return "STORE_MANAGER";
  if (upper === "COLABORADOR") return "EMPLOYEE";
  return upper;
}

export const createColaborador = createAction(
  colaboradorSchema,
  ["ADMIN", "STORE_MANAGER", "HR_STAFF"],
  async (data, session) => {
    try {
      const sessionLojaId = session?.user?.lojaId;
      const targetLojaId = data.lojaId || sessionLojaId;

      if (!targetLojaId) throw new Error("É necessário selecionar uma loja para cadastrar o colaborador.");

      const existing = await prisma.colaborador.findFirst({
        where: {
          OR: [
            { cpf: data.cpf },
            ...(data.email && data.email !== "" ? [{ email: data.email }] : [])
          ]
        }
      });
      if (existing) throw new Error(existing.cpf === data.cpf ? "CPF já cadastrado." : "E-mail já cadastrado.");

      const result = await prisma.$transaction(async (tx) => {
        let setor = await tx.setor.findFirst({ where: { nome: data.setorNome } });
        if (!setor) setor = await tx.setor.create({ data: { nome: data.setorNome } });

        let funcao = await tx.funcao.findFirst({ where: { nome: data.funcaoNome, setorId: setor.id } });
        if (!funcao) funcao = await tx.funcao.create({ data: { nome: data.funcaoNome, setorId: setor.id, salarioBase: 0 } });

        // Exclude all non-Prisma fields from rest (including dataNascimento to prevent raw string leak)
        const { setorNome: _s, funcaoNome: _f, lojaId: _l, agenciaBB: _ag, contaBB: _cb, dataNascimento: _dn, ...rest } = data;

        // Robust date parsing — avoids timezone shift with YYYY-MM-DD strings
        const [year, month, day] = data.dataNascimento.split("-").map(Number);
        if (!year || !month || !day || year < 1900 || year > new Date().getFullYear()) {
          throw new Error(`Data de nascimento inválida: ${data.dataNascimento}`);
        }
        const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Data de nascimento inválida: ${data.dataNascimento}`);
        }

        const colaborador = await tx.colaborador.create({
          data: {
            ...rest,
            lojaId: targetLojaId,
            setorId: setor.id,
            funcaoId: funcao.id,
            dataNascimento: parsedDate,
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
            data: docsToCreate.map(d => ({ colaboradorId: colaborador.id, nome: d.nome, path: d.path!, status: "PENDENTE" }))
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
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
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

  const role = normalizeRole(session.user.role as string);
  const isRH = role === "ADMIN" || role === "HR_STAFF";
  const userLojaId = session.user.lojaId;
  const targetLojaId = isRH ? filterLojaId : userLojaId;

  const skip = (page - 1) * limit;
  const where: any = {
    AND: [
      query ? { OR: [{ nomeCompleto: { contains: query, mode: "insensitive" } }, { cpf: { contains: query, mode: "insensitive" } }] } : {},
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

  const role = normalizeRole(session.user.role as string);
  const isRH = role === "ADMIN" || role === "HR_STAFF";
  const lojaId = session.user.lojaId;
  const where = isRH ? {} : (lojaId ? { lojaId } : {});

  return prisma.colaborador.findMany({
    where,
    include: { funcao: true, loja: true, setor: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function getColaboradoresParaPonto(search?: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, data: [], error: "Sem sessão" };

    const role = normalizeRole(session.user.role as string);
    const isRH = role === "ADMIN" || role === "HR_STAFF";
    const lojaId = session.user.lojaId;
    const where: any = isRH ? {} : (lojaId ? { lojaId } : {});
    if (search?.trim()) where.nomeCompleto = { contains: search.trim(), mode: "insensitive" };

    const data = await prisma.colaborador.findMany({
      where,
      select: { id: true, nomeCompleto: true, loja: { select: { nome: true } }, funcao: { select: { nome: true } } },
      orderBy: { nomeCompleto: "asc" },
      take: 50,
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: [], error: error?.message || "Erro ao buscar colaboradores" };
  }
}

export async function getColaboradorById(id: string) {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.colaborador.findUnique({
    where: { id },
    include: { funcao: true, loja: true, setor: true, documentos: true },
  });
}

export const deleteColaborador = createAction(
  z.string(),
  ["ADMIN", "HR_STAFF"],
  async (id) => {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete user account first (has a non-nullable FK to other records that would block cascade)
        await tx.user.deleteMany({ where: { colaboradorId: id } });
        // Schema cascades handle: Documento, Penalidade, Premio, ControleUniforme, RegistroPonto
        await tx.colaborador.delete({ where: { id } });
      });
      revalidatePath("/colaboradores");
      return { success: true };
    } catch (error) {
      console.error("[DELETE_COLABORADOR_ERROR]:", error);
      throw new Error("Falha ao excluir colaborador.");
    }
  }
);

const updateColaboradorSchema = z.object({
  id: z.string(),
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  telefonePrincipal: z.string().min(8, "Telefone inválido"),
  telefoneSecundario: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contaBancoBrasil: z.string().optional(),
  funcaoNome: z.string().min(1, "Obrigatório"),
  setorNome: z.string().min(1, "Obrigatório"),
  possuiFilhosMenores14: z.boolean(),
});

export const updateColaborador = createAction(
  updateColaboradorSchema,
  ["ADMIN", "STORE_MANAGER", "HR_STAFF"],
  async (data) => {
    const { id, funcaoNome, setorNome, ...rest } = data;

    let setor = await prisma.setor.findFirst({ where: { nome: setorNome } });
    if (!setor) setor = await prisma.setor.create({ data: { nome: setorNome } });

    let funcao = await prisma.funcao.findFirst({ where: { nome: funcaoNome, setorId: setor.id } });
    if (!funcao) funcao = await prisma.funcao.create({ data: { nome: funcaoNome, setorId: setor.id, salarioBase: 0 } });

    const colaborador = await prisma.colaborador.update({
      where: { id },
      data: {
        ...rest,
        email: rest.email || null,
        funcaoId: funcao.id,
        setorId: setor.id,
      },
    });

    revalidatePath(`/colaboradores/${id}`);
    revalidatePath("/colaboradores");
    return colaborador;
  }
);

