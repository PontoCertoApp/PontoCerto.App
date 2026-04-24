"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

async function getLojaIdFromSession() {
  const session = await auth();
  return session?.user?.lojaId ?? null;
}

export async function getRelatorioColaboradoresExperiencia() {
  const lojaId = await getLojaIdFromSession();
  return prisma.colaborador.findMany({
    where: {
      status: "EM_EXPERIENCIA",
      ...(lojaId ? { lojaId } : {}),
    },
    include: { funcao: true, setor: true, loja: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRelatorioDocumentacaoPendente() {
  const lojaId = await getLojaIdFromSession();
  return prisma.documento.findMany({
    where: {
      status: "PENDENTE",
      ...(lojaId ? { colaborador: { lojaId } } : {}),
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRelatorioHistoricoPenalidades(startDate: Date, endDate: Date) {
  const lojaId = await getLojaIdFromSession();
  return prisma.penalidade.findMany({
    where: {
      dataOcorrencia: { gte: startDate, lte: endDate },
      ...(lojaId ? { colaborador: { lojaId } } : {}),
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataOcorrencia: "desc" },
  });
}

export async function getRelatorioFolhaPremios(startDate: Date, endDate: Date) {
  const lojaId = await getLojaIdFromSession();
  return prisma.premio.findMany({
    where: {
      dataReferencia: { gte: startDate, lte: endDate },
      ...(lojaId ? { colaborador: { lojaId } } : {}),
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataReferencia: "desc" },
  });
}

export async function getRelatorioControleUniformes() {
  const lojaId = await getLojaIdFromSession();
  return prisma.controleUniforme.findMany({
    where: lojaId ? { colaborador: { lojaId } } : {},
    include: { colaborador: { include: { loja: true } } },
    orderBy: { dataRecebimento: "desc" },
  });
}

export async function getRelatorioVidaFuncional(colaboradorId: string) {
  return prisma.colaborador.findUnique({
    where: { id: colaboradorId },
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

export async function getRelatorioPGF(startDate: Date, endDate: Date) {
  const lojaId = await getLojaIdFromSession();
  return prisma.registroPonto.findMany({
    where: {
      data: { gte: startDate, lte: endDate },
      ...(lojaId ? { colaborador: { lojaId } } : {}),
    },
    include: { colaborador: { include: { loja: true } } },
    orderBy: [{ colaboradorId: "asc" }, { data: "asc" }],
  });
}
