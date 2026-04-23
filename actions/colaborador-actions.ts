"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/safe-action";
import { ColaboradorStatus } from "@/lib/enums";
import { sendWelcomeEmail } from "@/lib/email/send";
import { auth } from "@/auth";

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
  funcaoNome: z.string().min(1, "Obrigatório"),
  setorNome: z.string().min(1, "Obrigatório"),
  lojaId: z.string().optional(),
  
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
  ["RH"],
  async (data, session) => {
    console.log("[CREATE_COLABORADOR] Iniciando processo para:", data.nomeCompleto);
    try {
      console.log("[CREATE_COLABORADOR] Sessão recebida do wrapper:", session?.user?.email);
      
      const lojaId = session?.user?.lojaId;
      if (!lojaId) {
        console.error("[CREATE_COLABORADOR] Erro: Usuário sem lojaId");
        throw new Error("Usuário sem loja vinculada.");
      }

      // Check for existing CPF or Email
      console.log("[CREATE_COLABORADOR] Verificando duplicidade (CPF:", data.cpf, ")");
      const existing = await prisma.colaborador.findFirst({
        where: {
          OR: [
            { cpf: data.cpf },
            { email: data.email && data.email !== "" ? data.email : undefined }
          ].filter(Boolean) as any
        }
      });

      if (existing) {
        const msg = existing.cpf === data.cpf 
          ? "Já existe um colaborador com este CPF." 
          : "Já existe um colaborador com este E-mail.";
        console.warn("[CREATE_COLABORADOR] Duplicidade encontrada:", msg);
        throw new Error(msg);
      }

      console.log("[CREATE_COLABORADOR] Iniciando transação de banco...");
      const result = await prisma.$transaction(async (tx) => {
        // 1. Get or Create Setor
        let setor = await tx.setor.findFirst({ where: { nome: data.setorNome } });
        if (!setor) {
          console.log("[CREATE_COLABORADOR] Criando novo setor:", data.setorNome);
          setor = await tx.setor.create({ data: { nome: data.setorNome } });
        }

        // 2. Get or Create Funcao
        let funcao = await tx.funcao.findFirst({ where: { nome: data.funcaoNome, setorId: setor.id } });
        if (!funcao) {
          console.log("[CREATE_COLABORADOR] Criando nova função:", data.funcaoNome);
          funcao = await tx.funcao.create({
            data: { nome: data.funcaoNome, setorId: setor.id, salarioBase: 0 }
          });
        }

        const { setorNome, funcaoNome, lojaId: _, ...rest } = data;

        console.log("[CREATE_COLABORADOR] Criando registro do Colaborador...");
        const colaborador = await tx.colaborador.create({
          data: {
            ...rest,
            lojaId,
            setorId: setor.id,
            funcaoId: funcao.id,
            dataNascimento: new Date(data.dataNascimento),
            email: data.email || null,
            status: ColaboradorStatus.EM_EXPERIENCIA,
          },
        });

        // 4. Create separate Documento records
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
          console.log("[CREATE_COLABORADOR] Salvando", docsToCreate.length, "documentos no banco...");
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

      console.log("[CREATE_COLABORADOR] Cadastro concluído com sucesso id:", result.colaborador.id);

      const { colaborador, funcao } = result;

      if (colaborador.email) {
        const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { nome: true } });
        sendWelcomeEmail(colaborador.email, {
          colaboradorNome: colaborador.nomeCompleto,
          cargo: funcao?.nome ?? "Colaborador",
          loja: loja?.nome ?? "Empresa",
          dataAdmissao: new Date().toLocaleDateString("pt-BR"),
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
        }).catch((err) => console.error("[email/welcome] Falha:", err));
      }

      revalidatePath("/colaboradores");
      return colaborador;
    } catch (error: any) {
      console.error("[CREATE_COLABORADOR_FATAL]:", error);
      if (error.code === 'P2002') {
        throw new Error("Conflito de dados: CPF ou E-mail já cadastrado.");
      }
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
