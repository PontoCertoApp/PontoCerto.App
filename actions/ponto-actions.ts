"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PontoStatus, PontoInconformidade, PenalidadeTipo, PenalidadeStatus } from "@/lib/enums";
import { auth } from "@/auth";
import { sendPontoNotification } from "@/lib/email/send";
import { getScope, pontoScope, colaboradorScope } from "@/lib/scope";

const registroPontoSchema = z.object({
  colaboradorId: z.string(),
  manualName: z.string().optional(),
  data: z.date(),
  tipo: z.nativeEnum(PontoInconformidade),
  justificativa: z.string().optional(),
  gerarRap: z.boolean().default(false),
});

export async function registrarInconformidade(data: z.infer<typeof registroPontoSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };
  const userId = session.user.id!;

  try {
    const dataISO = typeof data.data === "string" ? (data.data as string).split("T")[0] : data.data.toISOString().split("T")[0];
    const dataPonto = new Date(`${dataISO}T12:00:00.000Z`);
    const isManual = data.colaboradorId === "MANUAL";
    let colaborador = null;
    let lojaId = session.user.lojaId || null;

    if (!isManual) {
      colaborador = await prisma.colaborador.findUnique({
        where: { id: data.colaboradorId },
        select: { id: true, nomeCompleto: true, email: true, lojaId: true },
      });
      if (!colaborador) throw new Error("Colaborador não encontrado");
      lojaId = colaborador.lojaId;
    } else if (data.manualName) {
      colaborador = await prisma.colaborador.findFirst({
        where: { nomeCompleto: { equals: data.manualName.trim(), mode: "insensitive" } },
        select: { id: true, nomeCompleto: true, email: true, lojaId: true },
      });
      if (colaborador) lojaId = colaborador.lojaId;
    }

    const result = await prisma.$transaction(async (tx) => {
      const finalColabId = colaborador ? colaborador.id : userId;

      const registro = await tx.registroPonto.create({
        data: {
          colaboradorId: finalColabId,
          lojaId,
          data: dataPonto,
          tipo: data.tipo,
          justificativa: !colaborador ? `[MANUAL: ${data.manualName}] ${data.justificativa || ""}` : data.justificativa,
          status: PontoStatus.INCONSISTENTE,
          rapGerado: data.gerarRap,
          criadoPorId: userId,
        },
      });

      const tiposNegativos = ["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA", "PONTO_NAO_REGISTRADO"];
      if (data.gerarRap && tiposNegativos.includes(data.tipo)) {
        await tx.penalidade.create({
          data: {
            colaboradorId: finalColabId,
            tipo: PenalidadeTipo.INCONSISTENCIA_PONTO,
            descricao: `Penalidade gerada por inconformidade de ponto: ${data.tipo}. Data: ${dataPonto.toLocaleDateString()}`,
            dataOcorrencia: dataPonto,
            validadeAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: PenalidadeStatus.ATIVA,
            geradoPorId: userId,
            registroPontoId: registro.id,
          },
        });
      }

      return registro;
    });

    if (colaborador?.email) {
      sendPontoNotification(colaborador.email, {
        colaboradorNome: colaborador.nomeCompleto,
        email: colaborador.email,
        data: data.data.toLocaleDateString("pt-BR"),
        tipo: data.tipo,
        justificativa: data.justificativa,
        rapGerado: data.gerarRap,
      }).catch((err) => console.error("[email/ponto] Falha:", err));
    }

    revalidatePath("/ponto");
    return { success: true, data: result };
  } catch (error) {
    console.error("[REGISTRAR_INCONFORMIDADE_ERROR]:", error);
    return { success: false, error: "Erro ao registrar ponto" };
  }
}

function toDateISO(value: Date | string | undefined | null): string {
  if (!value) return new Date().toISOString().split("T")[0];
  return typeof value === "string" ? value.split("T")[0] : value.toISOString().split("T")[0];
}

export async function getInconformidadesDoDia(data: Date | string) {
  try {
    const scope = await getScope();
    if (!scope) return [];

    const dataISO = toDateISO(data);
    const where = {
      ...pontoScope(scope),
      data: { gte: new Date(`${dataISO}T00:00:00.000Z`), lte: new Date(`${dataISO}T23:59:59.999Z`) },
    };

    const registros = await prisma.registroPonto.findMany({
      where,
      include: { colaborador: { include: { loja: true, setor: true, time: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return registros;
  } catch (error) {
    console.error("[GET_INCONFORMIDADES_DO_DIA_ERROR]:", error);
    return [];
  }
}

export async function getColaboradoresSemPontoNoDia(data: Date | string) {
  try {
    const scope = await getScope();
    if (!scope) return [];

    const dataISO = toDateISO(data);
    const registrosNoDia = await prisma.registroPonto.findMany({
      where: { data: { gte: new Date(`${dataISO}T00:00:00.000Z`), lte: new Date(`${dataISO}T23:59:59.999Z`) } },
      select: { colaboradorId: true },
    });

    const idsRegistrados = registrosNoDia.map((r) => r.colaboradorId);
    const baseFilter = colaboradorScope(scope);

    return prisma.colaborador.findMany({
      where: { ...baseFilter, id: { notIn: idsRegistrados } },
      include: { loja: true, funcao: true, setor: true, time: true },
      orderBy: { nomeCompleto: "asc" },
    });
  } catch (error) {
    console.error("[GET_COLABS_SEM_PONTO_ERROR]:", error);
    return [];
  }
}

export async function getTotalAtivos() {
  try {
    const scope = await getScope();
    if (!scope) return 0;
    const where = colaboradorScope(scope);
    return prisma.colaborador.count({ where });
  } catch {
    return 0;
  }
}

export async function getLeaderboard() {
  try {
    const scope = await getScope();
    if (!scope) return [];

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const where = { data: { gte: inicioMes }, ...pontoScope(scope) };

    const registros = await prisma.registroPonto.findMany({
      where,
      select: {
        colaboradorId: true,
        tipo: true,
        colaborador: { select: { nomeCompleto: true, loja: { select: { nome: true } }, time: { select: { nome: true } } } },
      },
    });

    const PONTOS_MAP: Record<string, number> = {
      PONTO_POSITIVO: 10, META_BATIDA: 50, ELOGIO: 100, PRESENCA_MANUAL: 5,
      FALTA_INJUSTIFICADA: -50, ATRASO: -10, SAIDA_ANTECIPADA: -10, PONTO_NAO_REGISTRADO: -20,
    };

    type LeaderboardEntry = { id: string; nome: string; loja: string; time: string | null; pontos: number; vitorias: number };
    const leaderboardMap: Record<string, LeaderboardEntry> = {};
    registros.forEach((r) => {
      if (!leaderboardMap[r.colaboradorId]) {
        leaderboardMap[r.colaboradorId] = {
          id: r.colaboradorId,
          nome: r.colaborador?.nomeCompleto || "Desconhecido",
          loja: r.colaborador?.loja?.nome || "Geral",
          time: r.colaborador?.time?.nome || null,
          pontos: 0,
          vitorias: 0,
        };
      }
      const pts = PONTOS_MAP[r.tipo || ""] || 0;
      leaderboardMap[r.colaboradorId].pontos += pts;
      if (pts > 0) leaderboardMap[r.colaboradorId].vitorias += 1;
    });

    return Object.values(leaderboardMap).sort((a, b) => b.pontos - a.pontos).slice(0, 5);
  } catch (error) {
    console.error("[GET_LEADERBOARD_ERROR]:", error);
    return [];
  }
}

export async function excluirInconformidade(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Não autorizado" };
    await prisma.registroPonto.delete({ where: { id } });
    revalidatePath("/ponto");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir" };
  }
}

export async function atualizarInconformidade(id: string, data: { tipo: string; justificativa?: string; gerarRap?: boolean }) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Não autorizado" };
    await prisma.registroPonto.update({ where: { id }, data: { tipo: data.tipo, justificativa: data.justificativa, rapGerado: data.gerarRap } });
    revalidatePath("/ponto");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar" };
  }
}

export async function getPontoStats() {
  try {
    const scope = await getScope();
    if (!scope) return { media: 0, crescimento: 0 };

    const now = new Date();
    const inicioMesAtual = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicioMesPassado = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fimMesPassado = new Date(now.getFullYear(), now.getMonth(), 0);

    const PONTOS_MAP: Record<string, number> = {
      PONTO_POSITIVO: 10, META_BATIDA: 50, ELOGIO: 100, PRESENCA_MANUAL: 5,
      FALTA_INJUSTIFICADA: -50, ATRASO: -10, SAIDA_ANTECIPADA: -10, PONTO_NAO_REGISTRADO: -20,
    };

    const [registrosAtual, registrosPassado, totalColaboradores] = await Promise.all([
      prisma.registroPonto.findMany({ where: { data: { gte: inicioMesAtual }, ...pontoScope(scope) }, select: { tipo: true } }),
      prisma.registroPonto.findMany({ where: { data: { gte: inicioMesPassado, lte: fimMesPassado }, ...pontoScope(scope) }, select: { tipo: true } }),
      prisma.colaborador.count({ where: colaboradorScope(scope) }),
    ]);

    const calcularTotal = (regs: { tipo: string }[]) => regs.reduce((acc, curr) => acc + (PONTOS_MAP[curr.tipo] || 0), 0);

    const totalAtual = calcularTotal(registrosAtual);
    const totalPassado = calcularTotal(registrosPassado);

    const media = totalColaboradores > 0 ? totalAtual / totalColaboradores : 0;
    
    let crescimento = 0;
    if (totalPassado > 0) {
      crescimento = ((totalAtual - totalPassado) / totalPassado) * 100;
    } else if (totalAtual > 0) {
      crescimento = 100;
    }

    return {
      media: Number(media.toFixed(1)),
      crescimento: Number(crescimento.toFixed(1))
    };
  } catch (error) {
    console.error("Erro ao buscar stats de ponto:", error);
    return { media: 0, crescimento: 0 };
  }
}
