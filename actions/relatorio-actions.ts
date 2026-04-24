"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

async function getReportFilter() {
  const session = await auth();
  if (!session?.user) return null;
  
  const isRH = session.user.role === "RH";
  const lojaId = session.user.lojaId;
  
  if (isRH) return {};
  if (!lojaId) return { id: "none" }; // Manager sem lojaId não vê nada
  
  return { lojaId };
}

export async function getRelatorioColaboradoresExperiencia() {
  const filter = await getReportFilter();
  if (!filter) return [];

  return prisma.colaborador.findMany({
    where: {
      status: "EM_EXPERIENCIA",
      ...filter,
    },
    include: { funcao: true, setor: true, loja: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRelatorioDocumentacaoPendente() {
  const filter = await getReportFilter();
  if (!filter) return [];

  const colabFilter = filter.lojaId ? { colaborador: { lojaId: filter.lojaId } } : {};

  return prisma.documento.findMany({
    where: {
      status: "PENDENTE",
      ...colabFilter,
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRelatorioHistoricoPenalidades(startDate: Date, endDate: Date) {
  const filter = await getReportFilter();
  if (!filter) return [];

  const colabFilter = filter.lojaId ? { colaborador: { lojaId: filter.lojaId } } : {};

  return prisma.penalidade.findMany({
    where: {
      dataOcorrencia: { gte: startDate, lte: endDate },
      ...colabFilter,
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataOcorrencia: "desc" },
  });
}

export async function getRelatorioFolhaPremios(startDate: Date, endDate: Date) {
  const filter = await getReportFilter();
  if (!filter) return [];

  const colabFilter = filter.lojaId ? { colaborador: { lojaId: filter.lojaId } } : {};

  return prisma.premio.findMany({
    where: {
      dataReferencia: { gte: startDate, lte: endDate },
      ...colabFilter,
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataReferencia: "desc" },
  });
}

export async function getRelatorioControleUniformes() {
  const filter = await getReportFilter();
  if (!filter) return [];

  const colabFilter = filter.lojaId ? { colaborador: { lojaId: filter.lojaId } } : {};

  return prisma.controleUniforme.findMany({
    where: colabFilter,
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataRecebimento: "desc" },
  });
}

export async function getRelatorioPGF(startDate: Date, endDate: Date) {
  const filter = await getReportFilter();
  if (!filter) return [];

  const colabFilter = filter.lojaId ? { colaborador: { lojaId: filter.lojaId } } : {};

  return prisma.registroPonto.findMany({
    where: {
      data: { gte: startDate, lte: endDate },
      ...colabFilter,
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: [{ colaboradorId: "asc" }, { data: "asc" }],
  });
}

export async function getRelatorioVidaFuncional(colaboradorId: string) {
  // Vida funcional é sempre específica de um colaborador, mas podemos validar se o usuário tem acesso
  const filter = await getReportFilter();
  if (!filter) return null;

  const colabFilter = filter.lojaId ? { id: colaboradorId, lojaId: filter.lojaId } : { id: colaboradorId };

  return prisma.colaborador.findUnique({
    where: colabFilter,
    include: {
      funcao: true,
      setor: true,
      loja: true,
      documentos: true,
      penalidades: true,
      premios: true,
      registrosPonto: { orderBy: { data: "desc" }, take: 30 },
      uniformes: true,
    },
  });
}
